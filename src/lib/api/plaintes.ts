// ── Plaintes ──────────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { Plainte } from '@/types/types';
import { getCached, setCache } from './_cache';
import { normalizePlainte, normalizePlaintes } from './_helpers';

const PAGE_SIZE = 12;

// Limites de texte exportées et utilisées côté formulaires / validators.ts
export const LIMITS = {
  game_server_name: { min: 2, max: 120 },
  admin_name:       { min: 2, max: 64  },
  pseudo_rp:        { min: 2, max: 64  },
  description:      { min: 20, max: 5000 },
  contexte:         { max: 2000 },
  raison:           { min: 10, max: 500 },
  comment:          { min: 2, max: 1000 },
  username:         { min: 3, max: 20 },
};

// Sélection complète réutilisée pour éviter les copier-coller
const PLAINTE_SELECT = `
  *,
  profiles!plaintes_user_id_fkey(username, avatar_url, pseudo_rp),
  categories!plaintes_category_id_fkey(name, color),
  votes(vote_type),
  commentaires(id)
`;

// Sélection allégée (sans champs rarement utilisés en liste)
const PLAINTE_SELECT_LIGHT = `
  id, user_id, category_id, game_server_name, admin_name, description, status,
  has_strong_evidence, created_at, updated_at,
  profiles!plaintes_user_id_fkey(username, avatar_url, pseudo_rp),
  categories!plaintes_category_id_fkey(name, color),
  votes(vote_type),
  commentaires(id)
`;

export interface FetchPlaintesOptions {
  categoryId?: string;
  search?:     string;
  status?:     string;
  sortBy?:     'date' | 'votes';
  limit?:      number;
}

export interface PlaintesCursorPage {
  plaintes: Plainte[];
  lastId:   string | null;
  hasMore:  boolean;
}

/** Liste filtrée avec cache 2 min en mémoire. */
export async function fetchPlaintes(options: FetchPlaintesOptions = {}): Promise<Plainte[]> {
  const { categoryId, search, status, sortBy = 'date', limit = PAGE_SIZE } = options;
  const safeLimit = Math.min(limit, 100);
  const cacheKey  = `plaintes:${JSON.stringify({ categoryId, search, status, sortBy, safeLimit })}`;

  const cached = getCached<Plainte[]>(cacheKey);
  if (cached) return cached;

  let q = supabase
    .from('plaintes')
    .select(PLAINTE_SELECT)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (categoryId)                 q = q.eq('category_id', categoryId);
  if (status && status !== 'all') q = q.eq('status', status);

  const { data } = await q;
  let plaintes = normalizePlaintes(Array.isArray(data) ? data : []);

  if (search) {
    const s = search.toLowerCase();
    plaintes = plaintes.filter(
      (p) =>
        p.game_server_name.toLowerCase().includes(s) ||
        p.admin_name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s),
    );
  }

  if (sortBy === 'votes') {
    plaintes.sort(
      (a, b) =>
        ((b.upvotes ?? 0) - (b.downvotes ?? 0)) -
        ((a.upvotes ?? 0) - (a.downvotes ?? 0)),
    );
  }

  setCache(cacheKey, plaintes, 120);
  return plaintes;
}

export async function fetchPlainteById(id: string): Promise<Plainte | null> {
  const { data } = await supabase
    .from('plaintes')
    .select(PLAINTE_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  return normalizePlainte(data);
}

/**
 * Version légère pour la HomePage — sans votes/commentaires,
 * idéale pour un premier rendu rapide.
 */
export async function fetchRecentPlaintesLight(lim = 4): Promise<Plainte[]> {
  const cacheKey = `recent_light:${lim}`;
  const cached   = getCached<Plainte[]>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from('plaintes')
    .select(`
      *,
      profiles!plaintes_user_id_fkey(username, avatar_url, pseudo_rp),
      categories!plaintes_category_id_fkey(name, color)
    `)
    .order('created_at', { ascending: false })
    .limit(lim);

  const result = normalizePlaintes(Array.isArray(data) ? data : []);
  setCache(cacheKey, result, 30);
  return result;
}

export async function fetchRecentPlaintes(lim = 5): Promise<Plainte[]> {
  const cacheKey = `recent_full:${lim}`;
  const cached   = getCached<Plainte[]>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from('plaintes')
    .select(PLAINTE_SELECT_LIGHT)
    .order('created_at', { ascending: false })
    .limit(lim);

  const result = normalizePlaintes(Array.isArray(data) ? data : []);
  setCache(cacheKey, result, 45);
  return result;
}

export async function fetchWonPlaintes(lim = 3): Promise<Plainte[]> {
  const cacheKey = `won:${lim}`;
  const cached   = getCached<Plainte[]>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from('plaintes')
    .select(PLAINTE_SELECT_LIGHT)
    .eq('status', 'Validée')
    .order('updated_at', { ascending: false })
    .limit(lim);

  const result = normalizePlaintes(Array.isArray(data) ? data : []);
  setCache(cacheKey, result, 60);
  return result;
}

export async function fetchMyPlaintes(userId: string): Promise<Plainte[]> {
  const { data } = await supabase
    .from('plaintes')
    .select(`
      id, user_id, category_id, game_server_name, admin_name, description, status,
      has_strong_evidence, created_at, updated_at, admin_note,
      profiles!plaintes_user_id_fkey(username, avatar_url, pseudo_rp),
      categories!plaintes_category_id_fkey(name, color),
      votes(vote_type),
      commentaires(id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return normalizePlaintes(Array.isArray(data) ? data : []);
}

export async function createPlainte(data: {
  category_id:      string;
  game_server_name: string;
  admin_name:       string;
  description:      string;
  pseudo_rp?:       string;
  raison?:          string;
  date_incident?:   string;
  contexte?:        string;
}): Promise<string> {
  const { data: row, error } = await supabase
    .from('plaintes')
    .insert({
      category_id:      data.category_id,
      game_server_name: data.game_server_name.trim().slice(0, 120),
      admin_name:       data.admin_name.trim().slice(0, 64),
      description:      data.description.trim().slice(0, 5000),
      pseudo_rp:        data.pseudo_rp?.trim()   || null,
      raison:           data.raison?.trim()       || null,
      date_incident:    data.date_incident        || null,
      contexte:         data.contexte?.trim()     || null,
    })
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row)  throw new Error('Création de la plainte échouée.');

  // Incrémenter le compteur — fire-and-forget
  void supabase.rpc('increment_stats_counter', { col: 'total_count' });

  return row.id as string;
}

export async function updatePlainte(
  id: string,
  updates: { status?: string; admin_note?: string; has_strong_evidence?: boolean },
): Promise<void> {
  const { error } = await supabase
    .from('plaintes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePlainte(id: string): Promise<void> {
  const { error } = await supabase.from('plaintes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Pagination cursor-based — évite les OFFSET coûteux sur grandes tables. */
export async function fetchPlaintesCursor(options: {
  limit?:      number;
  afterId?:    string | null;
  categoryId?: string;
  status?:     string;
  sortBy?:     'date' | 'votes';
  search?:     string;
}): Promise<PlaintesCursorPage> {
  const { limit: lim = PAGE_SIZE, afterId, categoryId, status, sortBy = 'date', search } = options;

  let q = supabase
    .from('plaintes')
    .select(`
      *,
      profiles!plaintes_user_id_fkey(username),
      categories!plaintes_category_id_fkey(name, color),
      votes(vote_type),
      commentaires(id)
    `)
    .order('created_at', { ascending: false })
    .limit(lim + 1);

  if (categoryId)                 q = q.eq('category_id', categoryId);
  if (status && status !== 'all') q = q.eq('status', status);

  if (afterId) {
    const { data: cur } = await supabase
      .from('plaintes')
      .select('created_at')
      .eq('id', afterId)
      .maybeSingle();
    if (cur) q = q.lt('created_at', cur.created_at);
  }

  const { data } = await q;
  const rows    = Array.isArray(data) ? data : [];
  const hasMore = rows.length > lim;
  const slice   = hasMore ? rows.slice(0, lim) : rows;
  let plaintes  = normalizePlaintes(slice);

  if (search) {
    const s = search.toLowerCase();
    plaintes = plaintes.filter(
      (p) =>
        p.game_server_name.toLowerCase().includes(s) ||
        p.admin_name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s),
    );
  }

  if (sortBy === 'votes') {
    plaintes.sort(
      (a, b) =>
        ((b.upvotes ?? 0) - (b.downvotes ?? 0)) -
        ((a.upvotes ?? 0) - (a.downvotes ?? 0)),
    );
  }

  return {
    plaintes,
    lastId:  hasMore ? slice[slice.length - 1].id : null,
    hasMore,
  };
}
