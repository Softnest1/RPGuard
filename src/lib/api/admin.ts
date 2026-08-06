// ── Administration ────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { Plainte, Profile } from '@/types/types';
import { normalizePlaintes } from './_helpers';

export async function fetchAdminPlaintes(options: {
  status?: string;
  search?: string;
  lim?:    number;
} = {}): Promise<Plainte[]> {
  const { status, search, lim = 100 } = options;

  let q = supabase
    .from('plaintes')
    .select(`
      id, user_id, category_id, game_server_name, admin_name, description, status,
      has_strong_evidence, created_at, updated_at, admin_note, cited_article,
      profiles!plaintes_user_id_fkey(username),
      categories!plaintes_category_id_fkey(name, color),
      votes(vote_type),
      commentaires(id)
    `)
    .order('created_at', { ascending: false })
    .limit(lim);

  if (status && status !== 'tous') q = q.eq('status', status);

  // Recherche côté DB via index — évite le filtrage JS sur 100+ lignes
  if (search?.trim()) {
    const s = search.trim();
    q = q.or(`game_server_name.ilike.%${s}%,admin_name.ilike.%${s}%`);
  }

  const { data } = await q;
  return normalizePlaintes(Array.isArray(data) ? data : []);
}

export async function adminUpdatePlainte(
  id:      string,
  updates: { status?: string; admin_note?: string; cited_article?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from('plaintes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAdminProfiles(search?: string): Promise<Profile[]> {
  let q = supabase
    .from('profiles')
    .select('id, username, role, avatar_url, pseudo_rp, bio, security_question, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  // Recherche côté DB via index — évite le filtrage JS
  if (search?.trim()) q = q.ilike('username', `%${search.trim()}%`);

  const { data } = await q;
  return Array.isArray(data) ? (data as Profile[]) : [];
}

export async function adminUpdateProfileRole(
  userId: string,
  role:   'user' | 'admin',
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);
}

/**
 * Récupère toutes les statistiques admin via une seule RPC (1 requête).
 * Remplace les 7 requêtes parallèles précédentes.
 */
export async function fetchAdminStats() {
  const { data, error } = await supabase.rpc('get_full_stats');
  if (error || !data) {
    console.error('[api/admin] fetchAdminStats RPC error:', error);
    return { plaintes: 0, enAttente: 0, validees: 0, rejetees: 0, viral: 0, users: 0, today: 0 };
  }
  const s = typeof data === 'string' ? JSON.parse(data) : data;
  return {
    plaintes:  Number(s.total)      || 0,
    enAttente: Number(s.en_attente) || 0,
    validees:  Number(s.won)        || 0,
    rejetees:  Number(s.rejetees)   || 0,
    viral:     Number(s.viral)      || 0,
    users:     Number(s.users)      || 0,
    today:     Number(s.today)      || 0,
  };
}
