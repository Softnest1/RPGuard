// ── Actualités ────────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';
import type { News } from '@/types/types';

export async function fetchNews(userId?: string): Promise<News[]> {
  if (userId) {
    const { data, error } = await supabase.rpc('get_news_with_reactions', { user_id: userId });
    if (error) throw new Error(error.message);
    return (data as News[]) ?? [];
  }
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as News[]) ?? [];
}

/**
 * Bascule la réaction "like" de l'utilisateur sur une actualité.
 * @param isLiked true si l'utilisateur a DÉJÀ liké → on retire. false → on ajoute.
 */
export async function toggleNewsReaction(
  newsId:  string,
  userId:  string,
  isLiked: boolean,
): Promise<void> {
  if (isLiked) {
    // Retirer le like existant
    const { error } = await supabase
      .from('news_reactions')
      .delete()
      .eq('news_id', newsId)
      .eq('user_id', userId)
      .eq('reaction_type', 'like');
    if (error) throw new Error(error.message);
  } else {
    // Ajouter un like
    const { error } = await supabase
      .from('news_reactions')
      .insert({ news_id: newsId, user_id: userId, reaction_type: 'like' });
    if (error) throw new Error(error.message);
  }
}

export async function createNews(
  payload: Omit<News, 'id' | 'created_at' | 'author_id'>,
): Promise<News> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  const { data, error } = await supabase
    .from('news')
    .insert({ ...payload, author_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as News;
}

export async function updateNews(
  id:      string,
  payload: Partial<Omit<News, 'id' | 'created_at' | 'author_id'>>,
): Promise<News> {
  const { data, error } = await supabase
    .from('news')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as News;
}

export async function deleteNews(id: string): Promise<void> {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
