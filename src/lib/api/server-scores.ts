// ── Scores de serveurs ────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { ServerScore } from '@/types/types';
import { getCached, setCache } from './_cache';

export async function fetchServerScores(): Promise<ServerScore[]> {
  const cacheKey = 'server_scores';
  const cached   = getCached<ServerScore[]>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from('server_scores')
    .select('*')
    .order('score')
    .limit(100);

  const result: ServerScore[] = Array.isArray(data) ? data : [];
  setCache(cacheKey, result, 60);
  return result;
}

/**
 * Obsolète — les scores sont mis à jour via trigger DB.
 * Conservé pour rétrocompatibilité.
 */
export async function computeAndSaveServerScores(): Promise<ServerScore[]> {
  return fetchServerScores();
}

// Re-export du type pour les imports directs depuis api
export type { ServerScore } from '@/types/types';
