-- ═══════════════════════════════════════════════════════════════
-- 1. SUPPRESSION DOUBLONS ET CORRECTIONS RLS
-- ═══════════════════════════════════════════════════════════════

-- plaintes : supprimer la policy DELETE public (faille critique — rôle public)
DROP POLICY "Utilisateurs peuvent supprimer leurs plaintes en attente" ON public.plaintes;

-- plaintes : remplacer "Authors can delete own plaintes" par une policy plus précise (statut En attente seulement)
DROP POLICY "Authors can delete own plaintes" ON public.plaintes;
CREATE POLICY "Authors can delete own pending plaintes"
  ON public.plaintes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'En attente'::plainte_status);

-- profiles : supprimer la policy SELECT anon redondante et confuse (false implicite)
DROP POLICY "Anon cannot access profiles" ON public.profiles;

-- ═══════════════════════════════════════════════════════════════
-- 2. SUPPRESSION INDEX DOUBLON sur profiles.username
--    (idx_profiles_security est identique à profiles_username_key)
-- ═══════════════════════════════════════════════════════════════
DROP INDEX public.idx_profiles_security;

-- ═══════════════════════════════════════════════════════════════
-- 3. INDEXES FK MANQUANTS — performances des jointures
-- ═══════════════════════════════════════════════════════════════

-- plaintes : index sur user_id (mes plaintes), status (filtrage), created_at (tri)
CREATE INDEX idx_plaintes_user_id     ON public.plaintes (user_id);
CREATE INDEX idx_plaintes_status      ON public.plaintes (status);
CREATE INDEX idx_plaintes_created_at  ON public.plaintes (created_at DESC);

-- commentaires : index sur plainte_id (chargement commentaires d'une plainte)
CREATE INDEX idx_commentaires_plainte_id ON public.commentaires (plainte_id);
CREATE INDEX idx_commentaires_user_id    ON public.commentaires (user_id);

-- votes : index sur plainte_id (agrégation votes)
CREATE INDEX idx_votes_plainte_id ON public.votes (plainte_id);
CREATE INDEX idx_votes_user_id    ON public.votes (user_id);

-- preuves : index sur plainte_id
CREATE INDEX idx_preuves_plainte_id ON public.preuves (plainte_id);

-- signalements : index sur plainte_id, user_id
CREATE INDEX idx_signalements_plainte_id ON public.signalements (plainte_id);
CREATE INDEX idx_signalements_user_id    ON public.signalements (user_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. CONTRAINTES DE LONGUEUR sur colonnes texte sensibles
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 3 AND 20);

ALTER TABLE public.plaintes
  ADD CONSTRAINT plaintes_description_min CHECK (char_length(description) >= 20),
  ADD CONSTRAINT plaintes_admin_name_min  CHECK (char_length(admin_name) >= 2),
  ADD CONSTRAINT plaintes_server_min      CHECK (char_length(game_server_name) >= 2);

ALTER TABLE public.commentaires
  ADD CONSTRAINT commentaires_content_min CHECK (char_length(content) >= 2);

-- ═══════════════════════════════════════════════════════════════
-- 5. POLICY manquante : commentaires UPDATE (auteur peut modifier)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can update own commentaires"
  ON public.commentaires
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);