
-- ═══════════════════════════════════════════════════════════════════════════
-- PLAINTES COLLECTIVES — Table co_plaignants
-- Permet à plusieurs victimes du même admin de rejoindre un dossier existant
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.co_plaignants (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plainte_id    uuid NOT NULL REFERENCES public.plaintes(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo_rp     text NOT NULL DEFAULT '',
  temoignage    text,              -- Récit personnel du co-plaignant (optionnel)
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- Un utilisateur ne peut rejoindre un dossier qu'une seule fois
  CONSTRAINT co_plaignants_unique_user UNIQUE (plainte_id, user_id)
);

-- ── Index de performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_co_plaignants_plainte_id
  ON public.co_plaignants(plainte_id);

CREATE INDEX IF NOT EXISTS idx_co_plaignants_user_id
  ON public.co_plaignants(user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.co_plaignants ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde peut voir les co-plaignants d'une plainte
CREATE POLICY "co_plaignants_select_public"
  ON public.co_plaignants FOR SELECT
  USING (true);

-- Insertion : uniquement l'utilisateur connecté qui n'est PAS le créateur
CREATE POLICY "co_plaignants_insert_own"
  ON public.co_plaignants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    -- Empêcher le créateur de la plainte de rejoindre sa propre plainte
    AND user_id != (
      SELECT p.user_id FROM public.plaintes p WHERE p.id = plainte_id
    )
  );

-- Suppression : uniquement l'utilisateur lui-même (quitter le dossier)
CREATE POLICY "co_plaignants_delete_own"
  ON public.co_plaignants FOR DELETE
  USING (auth.uid() = user_id);

-- Mise à jour : uniquement l'utilisateur lui-même (modifier son témoignage)
CREATE POLICY "co_plaignants_update_own"
  ON public.co_plaignants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Fonction count sécurisée ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION count_co_plaignants(p_plainte_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM public.co_plaignants WHERE plainte_id = p_plainte_id;
$$;
