-- Ajout de la colonne note admin sur les plaintes
ALTER TABLE plaintes ADD COLUMN IF NOT EXISTS admin_note text;

-- S'assurer que les admins peuvent tout faire sur les plaintes
-- (SELECT déjà couvert par la policy publique existante)

-- UPDATE admin sur plaintes
DROP POLICY IF EXISTS "admin_update_plaintes" ON plaintes;
CREATE POLICY "admin_update_plaintes"
  ON plaintes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (true);

-- DELETE admin sur plaintes
DROP POLICY IF EXISTS "admin_delete_plaintes" ON plaintes;
CREATE POLICY "admin_delete_plaintes"
  ON plaintes FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- UPDATE admin sur profiles (pour changer les rôles)
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  )
  WITH CHECK (true);

-- SELECT admin sur tous les profils
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  );

-- DELETE admin sur commentaires
DROP POLICY IF EXISTS "admin_delete_commentaires" ON commentaires;
CREATE POLICY "admin_delete_commentaires"
  ON commentaires FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
