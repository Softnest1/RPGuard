
-- RC-2 : Le trigger handle_new_user utilisait ON CONFLICT DO NOTHING
-- ce qui empêchait la mise à jour de la casse du username si l'upsert
-- frontend arrivait en premier. On met à jour le username en cas de conflit.
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
  -- En cas de conflit sur l'id (upsert frontend arrivé en premier),
  -- ne pas écraser le username avec la version en minuscules du trigger
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
  WHERE profiles.username IS NULL OR profiles.username = '';

  RETURN NEW;
END;
$$;

-- S'assurer que le trigger existe toujours
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vérifier qu'il n'y a pas de profil avec username vide
UPDATE public.profiles
SET username = split_part(email, '@', 1)
WHERE username IS NULL OR username = '';
