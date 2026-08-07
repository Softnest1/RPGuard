// ── Co-plaignants (dossiers collectifs) ──────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { CoPlaignant } from '@/types/types';

/** Récupère tous les co-plaignants d'une plainte avec leur profil. */
export async function fetchCoPlaignants(plainteId: string): Promise<CoPlaignant[]> {
  const { data, error } = await supabase
    .from('co_plaignants')
    .select('id, plainte_id, user_id, pseudo_rp, temoignage, created_at, profiles(username, avatar_url, pseudo_rp)')
    .eq('plainte_id', plainteId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    // profiles peut être un tableau (jointure) → on prend le premier élément
    profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
  })) as CoPlaignant[];
}

/** Vérifie si l'utilisateur connecté a déjà rejoint ce dossier. */
export async function checkUserJoined(plainteId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase
    .from('co_plaignants')
    .select('*', { count: 'exact', head: true })
    .eq('plainte_id', plainteId)
    .eq('user_id', user.id);
  return (count ?? 0) > 0;
}

/**
 * Rejoint un dossier collectif.
 * Le créateur ne peut pas rejoindre sa propre plainte (contrôlé côté RLS).
 */
export async function joinPlainte(
  plainteId:  string,
  pseudoRp:   string,
  temoignage?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Vous devez être connecté pour rejoindre ce dossier.');

  const { error } = await supabase.from('co_plaignants').insert({
    plainte_id: plainteId,
    user_id:    user.id,
    pseudo_rp:  pseudoRp.trim(),
    temoignage: temoignage?.trim() || null,
  });

  if (error) {
    if (error.code === '23505' || error.message.includes('unique'))
      throw new Error('Vous avez déjà rejoint ce dossier.');
    throw new Error(error.message);
  }
}

/** Quitte un dossier collectif. */
export async function leavePlainte(plainteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');
  const { error } = await supabase
    .from('co_plaignants')
    .delete()
    .eq('plainte_id', plainteId)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
}
