// ── Preuves (fichiers uploadés + liens vidéo externes) ───────────────────────
import { supabase } from '@/db/supabase';
import type { Preuve } from '@/types/types';
import { snakeCase, isValidUrl } from './_helpers';

export const ALLOWED_MIME_IMAGE = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif',  'image/heic', 'image/heif',
]);
export const ALLOWED_MIME_VIDEO = new Set([
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/mov',
]);
export const ALLOWED_MIME_ALL = new Set([...ALLOWED_MIME_IMAGE, ...ALLOWED_MIME_VIDEO]);

export async function fetchPreuves(plainteId: string): Promise<Preuve[]> {
  const { data } = await supabase
    .from('preuves')
    .select('id, plainte_id, file_path, file_name, file_type, created_at, lien_video, lien_label')
    .eq('plainte_id', plainteId)
    .order('created_at');

  return (Array.isArray(data) ? data : []).map((r) => ({
    ...r,
    publicUrl:
      r.file_type === 'link'
        ? undefined
        : supabase.storage.from('preuves').getPublicUrl(r.file_path).data.publicUrl,
  }));
}

/**
 * Ajoute un lien vidéo externe (TikTok, YouTube, Twitch…) comme preuve.
 * Validation URL stricte (protocol http/https requis).
 */
export async function addPreuveLien(
  plainteId: string,
  lienVideo:  string,
  lienLabel?: string,
): Promise<void> {
  const url = lienVideo.trim();
  if (!isValidUrl(url)) throw new Error('URL invalide. Utilisez une URL http(s) complète.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const { error } = await supabase.from('preuves').insert({
    plainte_id: plainteId,
    file_path:  '',
    file_name:  lienLabel?.trim() || null,
    file_type:  'link',
    lien_video: url,
    lien_label: lienLabel?.trim() || null,
  });
  if (error) throw new Error(error.message);

  void supabase.from('plaintes').update({
    has_strong_evidence: true,
    updated_at:          new Date().toISOString(),
  }).eq('id', plainteId);
}

/**
 * Upload un fichier image ou vidéo vers Supabase Storage + insère la métadonnée.
 * Retourne l'URL publique du fichier uploadé.
 */
export async function uploadPreuve(plainteId: string, file: File): Promise<string> {
  const isImage = ALLOWED_MIME_IMAGE.has(file.type) || file.type.startsWith('image/');
  const isVideo = ALLOWED_MIME_VIDEO.has(file.type) || file.type.startsWith('video/');

  if (!isImage && !isVideo)
    throw new Error(`Format non supporté : ${file.type || file.name}`);
  if (file.size > 50 * 1024 * 1024)
    throw new Error('Fichier trop volumineux (max 50 Mo).');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const ext  = (file.name.split('.').pop() ?? 'bin').replace(/[^a-zA-Z0-9]/g, '');
  const path = `${user.id}/${plainteId}/${snakeCase(file.name)}_${Date.now()}.${ext}`;
  const type = isImage ? 'image' : 'video';

  const { error: upErr } = await supabase.storage
    .from('preuves')
    .upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (upErr) throw new Error(upErr.message);

  const { error: dbErr } = await supabase.from('preuves').insert({
    plainte_id: plainteId,
    file_path:  path,
    file_name:  file.name,
    file_type:  type,
  });
  if (dbErr) throw new Error(dbErr.message);

  void supabase.from('plaintes').update({
    has_strong_evidence: true,
    updated_at:          new Date().toISOString(),
  }).eq('id', plainteId);

  return supabase.storage.from('preuves').getPublicUrl(path).data.publicUrl;
}
