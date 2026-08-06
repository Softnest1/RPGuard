// ── Catégories ────────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { Category } from '@/types/types';
import { getCached, setCache } from './_cache';

const CACHE_KEY = 'categories';
const CACHE_TTL = 10 * 60; // 10 min — données rarement modifiées

export async function fetchCategories(): Promise<Category[]> {
  const cached = getCached<Category[]>(CACHE_KEY);
  if (cached) return cached;

  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  const result: Category[] = Array.isArray(data) ? data : [];
  if (result.length > 0) setCache(CACHE_KEY, result, CACHE_TTL);
  return result;
}

/** No-op conservé pour rétrocompatibilité. */
export function primeCategoryCache(): Promise<void> {
  return Promise.resolve();
}
