// ── Accusés ───────────────────────────────────────────────────────────────────
// Note : le type Accuse est défini dans types.ts — pas de duplication ici.
import { supabase } from '@/db/supabase';
import type { Accuse } from '@/types/types';

export async function fetchAccuses(plainteId: string): Promise<Accuse[]> {
  const { data } = await supabase
    .from('accuses')
    .select('*')
    .eq('plainte_id', plainteId)
    .order('created_at');
  return Array.isArray(data) ? (data as Accuse[]) : [];
}

export async function createAccuse(
  plainteId: string,
  pseudoRp:  string,
  role:      string,
): Promise<void> {
  const { error } = await supabase.from('accuses').insert({
    plainte_id: plainteId,
    pseudo_rp:  pseudoRp.trim(),
    role:       role.trim(),
  });
  if (error) throw new Error(error.message);
}
