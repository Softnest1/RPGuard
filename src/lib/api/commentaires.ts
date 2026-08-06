// ── Commentaires ─────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { Commentaire } from '@/types/types';

export async function fetchCommentaires(plainteId: string): Promise<Commentaire[]> {
  const { data } = await supabase
    .from('commentaires')
    .select('*, profiles!commentaires_user_id_fkey(username, avatar_url, pseudo_rp)')
    .eq('plainte_id', plainteId)
    .order('created_at');
  return Array.isArray(data) ? (data as Commentaire[]) : [];
}

export async function createCommentaire(plainteId: string, content: string): Promise<void> {
  const { error } = await supabase.from('commentaires').insert({
    plainte_id: plainteId,
    content:    content.trim().slice(0, 1000),
  });
  if (error) throw new Error(error.message);
}

export async function deleteCommentaire(id: string): Promise<void> {
  const { error } = await supabase.from('commentaires').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
