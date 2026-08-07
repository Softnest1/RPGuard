-- ═══════════════════════════════════════════════════════════════════════
-- 1. SUPPRIMER le trigger doublon (formule divergente 20/10/2)
--    Garder uniquement trigger_update_server_score (formule 8/15/1)
-- ═══════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_update_server_scores ON plaintes;
DROP FUNCTION IF EXISTS public.update_server_scores();

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Enrichir server_scores — game_type dominant, dernière plainte, top admin
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE public.server_scores
  ADD COLUMN IF NOT EXISTS game_type        TEXT,
  ADD COLUMN IF NOT EXISTS last_plainte_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS top_admin_name   TEXT,
  ADD COLUMN IF NOT EXISTS plaintes_en_attente INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plaintes_rejetees   INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Remplacer recalculate_server_score — formule unifiée + colonnes enrichies
--    Formule : score = 100 - (valides×8) - (viral×15) - (total×1)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.recalculate_server_score(p_server_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total      INT;
  v_valides    INT;
  v_viral      INT;
  v_rejetees   INT;
  v_en_attente INT;
  v_score      INT;
  v_game_type  TEXT;
  v_last_at    TIMESTAMPTZ;
  v_top_admin  TEXT;
BEGIN
  -- Agréger les métriques du serveur
  SELECT
    COUNT(*)                                               INTO v_total
  FROM plaintes WHERE lower(trim(game_server_name)) = lower(trim(p_server_name));

  SELECT
    COUNT(*) FILTER (WHERE status = 'Validée'),
    COUNT(*) FILTER (WHERE status = 'Viral'),
    COUNT(*) FILTER (WHERE status = 'Rejetée'),
    COUNT(*) FILTER (WHERE status = 'En attente'),
    MAX(created_at)
  INTO v_valides, v_viral, v_rejetees, v_en_attente, v_last_at
  FROM plaintes WHERE lower(trim(game_server_name)) = lower(trim(p_server_name));

  -- game_type dominant (mode statistique — le plus fréquent parmi les non-null)
  SELECT game_type INTO v_game_type
  FROM plaintes
  WHERE lower(trim(game_server_name)) = lower(trim(p_server_name))
    AND game_type IS NOT NULL
  GROUP BY game_type
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Admin le plus signalé sur ce serveur
  SELECT admin_name INTO v_top_admin
  FROM plaintes
  WHERE lower(trim(game_server_name)) = lower(trim(p_server_name))
    AND admin_name IS NOT NULL AND trim(admin_name) != ''
  GROUP BY admin_name
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Formule score unifiée : 100 - valides×8 - viral×15 - total×1
  v_score := GREATEST(0, 100 - (v_valides * 8) - (v_viral * 15) - (v_total * 1));

  INSERT INTO public.server_scores (
    server_name, total_plaintes, plaintes_valides, plaintes_viral,
    plaintes_en_attente, plaintes_rejetees,
    score, game_type, last_plainte_at, top_admin_name, updated_at
  ) VALUES (
    p_server_name, v_total, v_valides, v_viral,
    v_en_attente, v_rejetees,
    v_score, v_game_type, v_last_at, v_top_admin, NOW()
  )
  ON CONFLICT (server_name) DO UPDATE SET
    total_plaintes      = EXCLUDED.total_plaintes,
    plaintes_valides    = EXCLUDED.plaintes_valides,
    plaintes_viral      = EXCLUDED.plaintes_viral,
    plaintes_en_attente = EXCLUDED.plaintes_en_attente,
    plaintes_rejetees   = EXCLUDED.plaintes_rejetees,
    score               = EXCLUDED.score,
    game_type           = EXCLUDED.game_type,
    last_plainte_at     = EXCLUDED.last_plainte_at,
    top_admin_name      = EXCLUDED.top_admin_name,
    updated_at          = NOW();
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Mettre à jour trigger_update_server_score pour gérer DELETE aussi
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trigger_update_server_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_name TEXT;
BEGIN
  -- Pour DELETE, utiliser OLD ; pour INSERT/UPDATE, utiliser NEW
  v_target_name := COALESCE(NEW.game_server_name, OLD.game_server_name);

  IF v_target_name IS NOT NULL AND trim(v_target_name) != '' THEN
    PERFORM recalculate_server_score(v_target_name);

    -- Si plus aucune plainte pour ce serveur → supprimer la ligne
    IF (SELECT COUNT(*) FROM plaintes
        WHERE lower(trim(game_server_name)) = lower(trim(v_target_name))) = 0 THEN
      DELETE FROM server_scores
      WHERE lower(trim(server_name)) = lower(trim(v_target_name));
    END IF;

    -- Si UPDATE avec changement de nom → recalculer l'ancien serveur aussi
    IF TG_OP = 'UPDATE' AND OLD.game_server_name IS DISTINCT FROM NEW.game_server_name THEN
      PERFORM recalculate_server_score(OLD.game_server_name);
      IF (SELECT COUNT(*) FROM plaintes
          WHERE lower(trim(game_server_name)) = lower(trim(OLD.game_server_name))) = 0 THEN
        DELETE FROM server_scores
        WHERE lower(trim(server_name)) = lower(trim(OLD.game_server_name));
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Recréer le trigger sur INSERT + UPDATE + DELETE (était seulement INSERT+UPDATE)
-- ═══════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS on_plainte_change_update_score ON plaintes;

CREATE TRIGGER on_plainte_change_update_score
  AFTER INSERT OR UPDATE OF status, game_server_name, admin_name, game_type OR DELETE
  ON plaintes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_server_score();

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Recalcul complet de tous les serveurs existants
-- ═══════════════════════════════════════════════════════════════════════
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT trim(game_server_name) AS sname
    FROM plaintes
    WHERE game_server_name IS NOT NULL AND trim(game_server_name) != ''
  LOOP
    PERFORM recalculate_server_score(r.sname);
  END LOOP;
END;
$$;