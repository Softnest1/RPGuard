
-- Permettre à chaque utilisateur de modifier son propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Utilisateurs peuvent modifier leur propre profil'
  ) THEN
    CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Permettre aux utilisateurs de supprimer leurs propres plaintes (si encore En attente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plaintes' AND policyname = 'Utilisateurs peuvent supprimer leurs plaintes en attente'
  ) THEN
    CREATE POLICY "Utilisateurs peuvent supprimer leurs plaintes en attente"
      ON plaintes FOR DELETE
      USING (auth.uid() = user_id AND status = 'En attente');
  END IF;
END $$;
