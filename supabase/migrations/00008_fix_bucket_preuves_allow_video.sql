
-- Le bucket preuves doit accepter les vidéos (preuve reine selon le guide)
-- Augmenter la limite à 50MB pour les vidéos
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ],
  file_size_limit = 52428800  -- 50 MB
WHERE name = 'preuves';
