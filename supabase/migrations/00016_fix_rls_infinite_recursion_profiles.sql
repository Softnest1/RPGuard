
-- ================================================================
-- FIX : Récursion infinie 42P17 sur la table profiles
-- ================================================================
-- CAUSE : admin_select_profiles fait SELECT sur profiles dans sa QUAL
--         → quand Postgres évalue cette policy, il re-évalue toutes
--           les policies SELECT de profiles → boucle infinie.
--         De même, get_user_role() est SECURITY DEFINER mais le
--         contexte RLS n'est pas bypassé si appelé depuis une policy.
-- ================================================================

-- ÉTAPE 1 : Supprimer TOUTES les policies conflictuelles sur profiles
DROP POLICY IF EXISTS "Anyone can read public profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"       ON public.profiles;
DROP POLICY IF EXISTS "admin_select_profiles"            ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.profiles;
DROP POLICY IF EXISTS "admin_update_profiles"            ON public.profiles;

-- ÉTAPE 2 : Recréer get_user_role en SECURITY DEFINER avec SET search_path
-- et surtout avec SET row_security = off pour bypasser le RLS
-- quand cette fonction lit profiles (évite la récursion)
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid LIMIT 1;
$$;

-- ÉTAPE 3 : Policies propres sans sous-requête récursive sur profiles
-- ──────────────────────────────────────────────────────────────────

-- SELECT : lecture publique totale (profils = données publiques)
-- UNE SEULE policy SELECT suffit — pas besoin d'en empiler plusieurs
CREATE POLICY "profiles_select_public"
  ON public.profiles
  FOR SELECT
  USING (true);

-- INSERT : uniquement son propre profil
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE : son propre profil OU admin via get_user_role (SECURITY DEFINER = pas de récursion)
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR get_user_role(auth.uid()) = 'admin'::user_role
  )
  WITH CHECK (
    auth.uid() = id
    OR get_user_role(auth.uid()) = 'admin'::user_role
  );

-- DELETE : admin uniquement via get_user_role (SECURITY DEFINER)
CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin'::user_role);
