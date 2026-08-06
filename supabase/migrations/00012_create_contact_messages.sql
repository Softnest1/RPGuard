
-- Table des messages de contact
CREATE TABLE contact_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL CHECK (char_length(email) <= 254),
  subject     text CHECK (char_length(subject) <= 200),
  message     text NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 4000),
  status      text NOT NULL DEFAULT 'non_lu' CHECK (status IN ('non_lu', 'lu', 'traite')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS activé
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Tout le monde (anon inclus) peut insérer un message
CREATE POLICY "contact_insert_public"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Seuls les admins peuvent lire les messages
CREATE POLICY "contact_select_admin"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent mettre à jour le statut
CREATE POLICY "contact_update_admin"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (true);

-- Seuls les admins peuvent supprimer
CREATE POLICY "contact_delete_admin"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Index pour tri par date
CREATE INDEX contact_messages_created_at_idx ON contact_messages (created_at DESC);
CREATE INDEX contact_messages_status_idx ON contact_messages (status);
