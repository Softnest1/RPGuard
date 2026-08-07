
-- ══════════════════════════════════════════════════════════════
-- FIX 1 : Policy INSERT sur profiles
-- L'upsert post-inscription était silencieusement bloqué
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════
-- FIX 2 : Trigger de création automatique du profil
-- Crée un profil minimal dès qu'un compte auth est créé
-- (filet de sécurité si le client échoue l'upsert)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  derived_username TEXT;
BEGIN
  -- Extraire le username depuis l'email factice (ex: monpseudo@miaoda.com -> monpseudo)
  derived_username := split_part(NEW.email, '@', 1);

  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    derived_username,
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attacher le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- FIX 3 : Contrainte UNIQUE sur username pour éviter les doublons
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;
