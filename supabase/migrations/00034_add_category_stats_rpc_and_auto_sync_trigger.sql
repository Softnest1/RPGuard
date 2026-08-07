-- ═══════════════════════════════════════════════════════════════════════
-- 1. RPC get_category_stats — agrégation SQL pure (remplace le JS frontend)
--    Retourne les 6 catégories les plus signalées avec leur count
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_category_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object('name', name, 'count', cnt)
      ORDER BY cnt DESC
    ),
    '[]'::json
  )
  FROM (
    SELECT
      c.name,
      COUNT(p.id) AS cnt
    FROM categories c
    LEFT JOIN plaintes p ON p.category_id = c.id
    GROUP BY c.id, c.name
    HAVING COUNT(p.id) > 0
    ORDER BY cnt DESC
    LIMIT 6
  ) sub;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Trigger auto-sync stats_global à chaque INSERT/UPDATE/DELETE plainte
--    → stats toujours à jour en temps réel, sans cron
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.sync_stats_on_plainte_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stats_global SET
    total_count  = (SELECT COUNT(*) FROM plaintes),
    server_count = (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
    today_count  = (SELECT COUNT(*) FROM plaintes
                    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
    won_count    = (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
    updated_at   = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$;

-- Supprimer l'ancien trigger si existant
DROP TRIGGER IF EXISTS trg_sync_stats_on_plainte ON plaintes;

-- Créer le trigger sur INSERT, UPDATE de status/game_server_name, DELETE
CREATE TRIGGER trg_sync_stats_on_plainte
  AFTER INSERT OR DELETE OR UPDATE OF status, game_server_name
  ON plaintes
  FOR EACH STATEMENT
  EXECUTE FUNCTION sync_stats_on_plainte_change();

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Trigger auto-sync user_count à chaque INSERT/DELETE profil
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.sync_stats_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stats_global SET
    user_count = (SELECT COUNT(*) FROM profiles),
    updated_at = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_stats_on_profile ON profiles;

CREATE TRIGGER trg_sync_stats_on_profile
  AFTER INSERT OR DELETE
  ON profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION sync_stats_on_profile_change();

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Recalcul complet immédiat pour synchroniser l'état actuel
-- ═══════════════════════════════════════════════════════════════════════
UPDATE stats_global SET
  total_count  = (SELECT COUNT(*) FROM plaintes),
  server_count = (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
  user_count   = (SELECT COUNT(*) FROM profiles),
  today_count  = (SELECT COUNT(*) FROM plaintes
                  WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
  won_count    = (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
  updated_at   = now()
WHERE id = 1;