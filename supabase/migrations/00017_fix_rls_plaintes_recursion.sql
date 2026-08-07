
-- ================================================================
-- FIX : Policies plaintes avec sous-requêtes récursives sur profiles
-- ================================================================
-- admin_delete_plaintes et admin_update_plaintes utilisent
-- EXISTS (SELECT 1 FROM profiles WHERE ...) depuis une policy
-- sur plaintes — pas directement récursif, mais si profiles
-- a un RLS re-évalué cela peut propager l'erreur.
-- On les remplace par get_user_role() SECURITY DEFINER.
-- ================================================================

DROP POLICY IF EXISTS "admin_delete_plaintes" ON public.plaintes;
DROP POLICY IF EXISTS "admin_update_plaintes"  ON public.plaintes;
DROP POLICY IF EXISTS "Admins manage all plaintes" ON public.plaintes;

-- Politique admin unifiée pour plaintes via get_user_role (SECURITY DEFINER)
CREATE POLICY "plaintes_all_admin"
  ON public.plaintes
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);
