
-- Table : historique des exports PDF générés par chaque utilisateur
CREATE TABLE IF NOT EXISTS pdf_exports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plainte_id    uuid NOT NULL REFERENCES plaintes(id)   ON DELETE CASCADE,
  server_name   text NOT NULL DEFAULT '',
  admin_name    text NOT NULL DEFAULT '',
  filename      text NOT NULL DEFAULT '',
  exported_at   timestamptz NOT NULL DEFAULT now()
);

-- Index pour récupération rapide par utilisateur (tri anti-chrono)
CREATE INDEX IF NOT EXISTS pdf_exports_user_id_exported_at_idx
  ON pdf_exports (user_id, exported_at DESC);

-- Index pour récupération par plainte
CREATE INDEX IF NOT EXISTS pdf_exports_plainte_id_idx
  ON pdf_exports (plainte_id);

-- RLS : activé, chaque utilisateur ne voit que ses propres exports
ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;

-- SELECT : l'utilisateur voit seulement ses propres lignes
CREATE POLICY "pdf_exports_select_own"
  ON pdf_exports FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT : l'utilisateur insère seulement pour lui-même
CREATE POLICY "pdf_exports_insert_own"
  ON pdf_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE : l'utilisateur peut supprimer ses propres entrées
CREATE POLICY "pdf_exports_delete_own"
  ON pdf_exports FOR DELETE
  USING (auth.uid() = user_id);
