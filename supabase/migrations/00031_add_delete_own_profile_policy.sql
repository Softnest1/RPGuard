
-- Permettre à un utilisateur authentifié de supprimer son propre profil
-- (nécessaire pour la suppression de compte côté Edge Function avec service-role,
--  mais aussi pour que la suppression via la table profiles soit autorisée en RLS)
-- Note : la suppression réelle se fait via supabase.auth.admin.deleteUser() dans l'Edge Function
-- qui utilise le service-role et contourne RLS — cette policy est défensive.

-- Supprimer l'ancienne policy admin-only pour la remplacer par une couvrant user + admin
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Admins peuvent tout supprimer
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Un utilisateur peut supprimer son propre profil
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);
