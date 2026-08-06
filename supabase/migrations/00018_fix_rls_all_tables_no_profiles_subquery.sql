
-- ================================================================
-- FIX GLOBAL : Supprimer toutes les sous-requêtes FROM profiles
-- dans les policies de commentaires et contact_messages.
-- Remplacer par get_user_role() SECURITY DEFINER (sans récursion).
-- ================================================================

-- ── commentaires ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_delete_commentaires" ON public.commentaires;

CREATE POLICY "commentaires_delete_own_or_admin"
  ON public.commentaires
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) = 'admin'::user_role
  );

-- ── contact_messages ────────────────────────────────────────────
DROP POLICY IF EXISTS "contact_delete_admin"  ON public.contact_messages;
DROP POLICY IF EXISTS "contact_select_admin"  ON public.contact_messages;
DROP POLICY IF EXISTS "contact_update_admin"  ON public.contact_messages;

CREATE POLICY "contact_messages_select_admin"
  ON public.contact_messages
  FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "contact_messages_update_admin"
  ON public.contact_messages
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "contact_messages_delete_admin"
  ON public.contact_messages
  FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin'::user_role);
