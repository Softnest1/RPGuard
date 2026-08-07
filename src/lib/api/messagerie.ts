// ── Messagerie privée ─────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { Profile, Conversation, Message } from '@/types/types';

const MAX_MESSAGES = 100; // borne de sécurité mémoire

export async function searchUsers(query: string): Promise<Partial<Profile>[]> {
  if (!query || query.length < 2) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role, bio, pseudo_rp, created_at')
    .ilike('username', `%${query}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrCreateConversation(otherUserId: string): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('*')
    .or(
      `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),` +
      `and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ user1_id: user.id, user2_id: otherUserId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return newConv;
}

/**
 * Récupère toutes les conversations enrichies de l'utilisateur.
 * Optimisé : 1 requête conversations + batchs profilset messages via Promise.all,
 * mais limité à 30 conversations pour éviter les N+1 excessifs.
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })
    .limit(30); // borne : évite N+1 excessif sur comptes très actifs
  if (error) throw new Error(error.message);

  const convList = conversations ?? [];
  const otherIds = convList.map((c) => (c.user1_id === user.id ? c.user2_id : c.user1_id));

  // Batch 1 : tous les profils en une seule requête
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', [...new Set(otherIds)]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Batch 2 : dernier message + compteur non-lus en parallèle par conversation
  const enriched: Conversation[] = await Promise.all(
    convList.map(async (conv) => {
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

      const [lastMsgResult, unreadResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_id', otherId)
          .eq('is_read', false),
      ]);

      return {
        ...conv,
        other_user:   profileMap.get(otherId) ?? null,
        last_message: lastMsgResult.data ?? null,
        unread_count: unreadResult.count ?? 0,
      };
    }),
  );

  return enriched;
}

/**
 * Récupère les messages d'une conversation (ordre chronologique).
 * Limité à MAX_MESSAGES pour éviter les crashs mémoire.
 */
export async function fetchMessages(
  conversationId: string,
  limit = MAX_MESSAGES,
  beforeId?: string,
): Promise<Message[]> {
  const safeLimit = Math.min(limit, MAX_MESSAGES);

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (beforeId) {
    const { data: pivot } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', beforeId)
      .maybeSingle();
    if (pivot) query = query.lt('created_at', pivot.created_at);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Réordonnement chronologique pour l'affichage
  const msgs = ((data ?? []) as Message[]).reverse();
  return msgs.map((msg) => {
    if (msg.message_type === 'voice' && msg.voice_file_path) {
      const { data: urlData } = supabase.storage
        .from('audio_messages')
        .getPublicUrl(msg.voice_file_path);
      return { ...msg, voice_public_url: urlData.publicUrl };
    }
    return msg;
  });
}

export async function sendMessage(
  conversationId: string,
  content:        string | null,
  type:           'text' | 'voice',
  voiceBlob?:     Blob,
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  let voice_file_path: string | null = null;
  if (type === 'voice' && voiceBlob) {
    const filename = `${user.id}/${Date.now()}.webm`;
    const { error: uploadErr } = await supabase.storage
      .from('audio_messages')
      .upload(filename, voiceBlob, { contentType: 'audio/webm' });
    if (uploadErr) throw new Error("Erreur d'envoi vocal : " + uploadErr.message);
    voice_file_path = filename;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content, message_type: type, voice_file_path })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Mise à jour du timestamp de conversation — fire-and-forget
  void supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  let msg = data as Message;
  if (msg.message_type === 'voice' && msg.voice_file_path) {
    const { data: urlData } = supabase.storage
      .from('audio_messages')
      .getPublicUrl(msg.voice_file_path);
    msg = { ...msg, voice_public_url: urlData.publicUrl };
  }
  return msg;
}

export async function markMessagesAsRead(conversationId: string, otherUserId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw new Error(error.message);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw new Error(error.message);
}
