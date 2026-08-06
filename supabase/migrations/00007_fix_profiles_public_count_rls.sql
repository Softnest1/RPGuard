
-- Permettre à n'importe qui de lire les profils publics (pseudo + role)
-- Nécessaire pour le count de membres sur la homepage visiteur
-- et pour afficher username sur les plaintes publiques
CREATE POLICY "Anyone can read public profiles"
  ON profiles
  FOR SELECT
  USING (true);
