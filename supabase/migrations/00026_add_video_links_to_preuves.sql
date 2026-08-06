
-- ═══════════════════════════════════════════════════════════
-- Ajouter support liens vidéo externes (TikTok, YouTube, etc.)
-- dans la table preuves
-- ═══════════════════════════════════════════════════════════

-- Ajouter colonne lien_video (URL externe nullable)
ALTER TABLE preuves
  ADD COLUMN IF NOT EXISTS lien_video text,
  ADD COLUMN IF NOT EXISTS lien_label text; -- optionnel: description du lien

-- Index pour requêtes filtrées par type de preuve
CREATE INDEX IF NOT EXISTS idx_preuves_file_type ON preuves(file_type);

-- Contrainte : lien_video doit commencer par http si renseigné
ALTER TABLE preuves DROP CONSTRAINT IF EXISTS preuves_lien_video_format;
ALTER TABLE preuves ADD CONSTRAINT preuves_lien_video_format
  CHECK (lien_video IS NULL OR lien_video ~* '^https?://');

-- Mettre à jour file_type pour accepter 'link' comme type
-- (les anciennes valeurs 'image' et 'video' restent valides)
ALTER TABLE preuves DROP CONSTRAINT IF EXISTS preuves_file_type_check;
ALTER TABLE preuves ADD CONSTRAINT preuves_file_type_check
  CHECK (file_type IN ('image', 'video', 'link'));
