
-- 1. Nouveaux champs sur la table plaintes
ALTER TABLE plaintes
  ADD COLUMN IF NOT EXISTS pseudo_rp          text,
  ADD COLUMN IF NOT EXISTS raison             text,
  ADD COLUMN IF NOT EXISTS date_incident      date,
  ADD COLUMN IF NOT EXISTS contexte           text;

-- Longueur sécurisée sur les nouveaux champs
ALTER TABLE plaintes
  ADD CONSTRAINT plaintes_pseudo_rp_length   CHECK (char_length(pseudo_rp) <= 64),
  ADD CONSTRAINT plaintes_raison_length      CHECK (char_length(raison) <= 500),
  ADD CONSTRAINT plaintes_contexte_length    CHECK (char_length(contexte) <= 2000);

-- 2. Table des personnes mises en cause (plusieurs par plainte)
CREATE TABLE IF NOT EXISTS accuses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plainte_id  uuid NOT NULL REFERENCES plaintes(id) ON DELETE CASCADE,
  pseudo_rp   text NOT NULL CHECK (char_length(pseudo_rp) BETWEEN 1 AND 64),
  role        text NOT NULL DEFAULT 'Inconnu' CHECK (role IN ('Administrateur', 'Modérateur', 'Helper', 'Staff', 'Inconnu')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accuses_plainte_id_idx ON accuses(plainte_id);

-- RLS accuses
ALTER TABLE accuses ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "accuses_select_public" ON accuses
  FOR SELECT USING (true);

-- Insertion par l'auteur de la plainte uniquement
CREATE POLICY "accuses_insert_owner" ON accuses
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM plaintes WHERE id = plainte_id)
  );

-- Suppression par l'auteur de la plainte uniquement
CREATE POLICY "accuses_delete_owner" ON accuses
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM plaintes WHERE id = plainte_id)
  );

-- 3. Colonne file_type sur preuves (image | video)
ALTER TABLE preuves
  ADD COLUMN IF NOT EXISTS file_type text NOT NULL DEFAULT 'image'
    CHECK (file_type IN ('image', 'video'));
