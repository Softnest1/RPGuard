
-- Ajouter question secrète et réponse sur les profils
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS security_question TEXT,
  ADD COLUMN IF NOT EXISTS security_answer   TEXT;

-- Index pour la récupération par username
CREATE INDEX IF NOT EXISTS idx_profiles_security ON profiles(username);
