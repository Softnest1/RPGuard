// ── Votes ─────────────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { VoteType, Vote } from '@/types/types';

export async function fetchUserVote(plainteId: string, userId: string): Promise<VoteType | null> {
  const { data } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('plainte_id', plainteId)
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.vote_type as VoteType) ?? null;
}

/**
 * Crée, change ou supprime (toggle) le vote de l'utilisateur connecté.
 * Si le même vote est soumis deux fois → suppression (retrait du vote).
 */
export async function upsertVote(plainteId: string, voteType: VoteType): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const existing = await fetchUserVote(plainteId, user.id);

  if (existing === voteType) {
    // Toggle : retire le vote existant
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('plainte_id', plainteId)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
    return;
  }

  if (existing) {
    // Change de vote
    const { error } = await supabase
      .from('votes')
      .update({ vote_type: voteType })
      .eq('plainte_id', plainteId)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
  } else {
    // Nouveau vote
    const { error } = await supabase
      .from('votes')
      .insert({ plainte_id: plainteId, user_id: user.id, vote_type: voteType });
    if (error) throw new Error(error.message);
  }
}

// ── Aliases de compatibilité ─────────────────────────────────────────────────

/** Retourne le vote complet de l'utilisateur connecté pour une plainte. */
export async function getUserVote(plainteId: string): Promise<Vote | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('votes')
    .select('*')
    .eq('plainte_id', plainteId)
    .eq('user_id', user.id)
    .maybeSingle();
  return data ?? null;
}

/** Alias de upsertVote — conservé pour rétrocompatibilité. */
export async function submitVote(plainteId: string, voteType: VoteType): Promise<void> {
  return upsertVote(plainteId, voteType);
}

/** Supprime le vote de l'utilisateur connecté. */
export async function removeVote(plainteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('plainte_id', plainteId)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
}
