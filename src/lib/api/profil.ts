// ── Profil utilisateur ────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';
import { sha256 } from './_helpers';

const ALLOWED_MIME_AVATAR = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, role, avatar_url, pseudo_rp, bio, security_question, created_at')
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, role, avatar_url, pseudo_rp, bio, created_at')
    .eq('username', username.trim())
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function updateProfile(
  userId:  string,
  updates: {
    username?:          string;
    pseudo_rp?:         string | null;
    bio?:               string | null;
    security_question?: string;
    security_answer?:   string;
    avatar_url?:        string | null;
  },
): Promise<void> {
  const payload: Record<string, string | null> = {};
  if (updates.username          !== undefined) payload.username          = updates.username ?? null;
  if (updates.pseudo_rp         !== undefined) payload.pseudo_rp         = updates.pseudo_rp ?? null;
  if (updates.bio               !== undefined) payload.bio               = updates.bio ?? null;
  if (updates.security_question !== undefined) payload.security_question = updates.security_question || null;
  if (updates.avatar_url        !== undefined) payload.avatar_url        = updates.avatar_url ?? null;
  if (updates.security_answer   !== undefined) {
    payload.security_answer = updates.security_answer
      ? await sha256(updates.security_answer.trim().toLowerCase())
      : null;
  }
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('username', username.trim());
  return (count ?? 0) === 0;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED_MIME_AVATAR.has(file.type))
    throw new Error('Format non supporté. Utilisez JPEG, PNG, WEBP ou GIF.');
  if (file.size > 5 * 1024 * 1024)
    throw new Error('Image trop volumineuse (max 5 Mo).');

  const ext  = (file.name.split('.').pop() ?? 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const path = `${userId}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) throw new Error(upErr.message);

  const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);
  if (dbErr) throw new Error(dbErr.message);

  return publicUrl;
}

// ── Question / réponse secrète ────────────────────────────────────────────────

export async function fetchSecurityQuestion(
  username: string,
): Promise<{ profileId: string; question: string } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, security_question')
    .eq('username', username.trim())
    .maybeSingle();
  if (!data?.security_question) return null;
  return { profileId: data.id as string, question: data.security_question as string };
}

export async function verifySecurityAnswer(profileId: string, answer: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('security_answer')
    .eq('id', profileId)
    .maybeSingle();
  if (!data?.security_answer) return false;
  return (await sha256(answer.trim().toLowerCase())) === data.security_answer;
}

// ── Reset token ───────────────────────────────────────────────────────────────

export async function setResetToken(profileId: string, token: string): Promise<void> {
  const hash    = await sha256(token);
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await supabase.from('profiles').update({
    reset_token_hash:    hash,
    reset_token_expires: expires,
  }).eq('id', profileId);
}

export async function clearResetToken(profileId: string): Promise<void> {
  await supabase.from('profiles').update({
    reset_token_hash:    null,
    reset_token_expires: null,
  }).eq('id', profileId);
}
