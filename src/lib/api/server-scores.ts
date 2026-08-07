// ── Scores de serveurs ────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { ServerScore } from '@/types/types';
import { getCached, setCache, invalidateCache } from './_cache';

const CACHE_KEY = 'server_scores';
const CACHE_TTL = 60; // secondes

export async function fetchServerScores(forceRefresh = false): Promise<ServerScore[]> {
  if (!forceRefresh) {
    const cached = getCached<ServerScore[]>(CACHE_KEY);
    if (cached) return cached;
  } else {
    // Invalider le cache pour forcer un rechargement depuis la DB
    invalidateCache(CACHE_KEY);
  }

  const { data } = await supabase
    .from('server_scores')
    .select('id, server_name, total_plaintes, plaintes_valides, plaintes_viral, plaintes_en_attente, plaintes_rejetees, score, game_type, last_plainte_at, top_admin_name, updated_at')
    .order('score', { ascending: true })
    .limit(100);

  const result: ServerScore[] = Array.isArray(data) ? data : [];
  setCache(CACHE_KEY, result, CACHE_TTL);
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
