// ── Signalements ─────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';

export async function fetchSignalements(plainteId: string): Promise<number> {
  const { count } = await supabase
    .from('signalements')
    .select('*', { count: 'exact', head: true })
    .eq('plainte_id', plainteId);
  return count ?? 0;
}

/**
 * Crée un signalement.
 * Ignore silencieusement les doublons (contrainte unique DB code 23505).
 */
export async function createSignalement(plainteId: string): Promise<void> {
  const { error } = await supabase
    .from('signalements')
    .insert({ plainte_id: plainteId });
  if (error && error.code !== '23505' && !error.message.includes('unique'))
    throw new Error(error.message);
}
