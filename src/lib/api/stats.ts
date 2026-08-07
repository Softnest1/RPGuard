// ── Stats globales ────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { PlaintegStats } from '@/types/types';

/**
 * Lecture rapide depuis la table dénormalisée stats_global.
 * Répond en ~50 ms (1 seul SELECT par clé primaire).
 */
export async function fetchStatsQuick(): Promise<PlaintegStats> {
  const { data } = await supabase
    .from('stats_global')
    .select('total_count, server_count, user_count, today_count, won_count')
    .eq('id', 1)
    .maybeSingle();
  if (!data) return { total: 0, servers: 0, users: 0, today: 0, won: 0 };
  return {
    total:   data.total_count  ?? 0,
    servers: data.server_count ?? 0,
    users:   data.user_count   ?? 0,
    today:   data.today_count  ?? 0,
    won:     data.won_count    ?? 0,
  };
}

/**
 * Recalcule les stats via la fonction SQL get_full_stats (1 RPC = 1 requête).
 * Fallback sur fetchStatsQuick() en cas d'erreur RPC.
 */
export async function fetchStats(): Promise<PlaintegStats> {
  const { data, error } = await supabase.rpc('get_full_stats');
  if (error || !data) {
    console.error('[api/stats] fetchStats RPC error:', error);
    return fetchStatsQuick();
  }
  const s = typeof data === 'string' ? JSON.parse(data) : data;
  const result: PlaintegStats = {
    total:   Number(s.total)   || 0,
    servers: Number(s.servers) || 0,
    users:   Number(s.users)   || 0,
    today:   Number(s.today)   || 0,
    won:     Number(s.won)     || 0,
  };
  // Mise à jour stats_global — fire-and-forget non-bloquant
  void supabase.from('stats_global').update({
    total_count:  result.total,
    server_count: result.servers,
    user_count:   result.users,
    today_count:  result.today,
    won_count:    result.won,
    updated_at:   new Date().toISOString(),
  }).eq('id', 1);
  return result;
}
