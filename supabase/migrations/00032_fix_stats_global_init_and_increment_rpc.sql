
-- 1. S'assurer que la ligne stats_global existe avec les vraies valeurs calculées
INSERT INTO stats_global (id, total_count, server_count, user_count, today_count, won_count, updated_at)
SELECT
  1,
  (SELECT COUNT(*) FROM plaintes),
  (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
  (SELECT COUNT(*) FROM profiles),
  (SELECT COUNT(*) FROM plaintes WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
  (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
  now()
ON CONFLICT (id) DO UPDATE SET
  total_count  = (SELECT COUNT(*) FROM plaintes),
  server_count = (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
  user_count   = (SELECT COUNT(*) FROM profiles),
  today_count  = (SELECT COUNT(*) FROM plaintes WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
  won_count    = (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
  updated_at   = now();

-- 2. Créer/remplacer increment_stats_counter (référencé dans AuthContext)
CREATE OR REPLACE FUNCTION public.increment_stats_counter(col text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF col = 'user_count' THEN
    UPDATE stats_global SET user_count = user_count + 1, updated_at = now() WHERE id = 1;
  ELSIF col = 'total_count' THEN
    UPDATE stats_global SET total_count = total_count + 1, updated_at = now() WHERE id = 1;
  END IF;
END;
$$;

-- 3. Recalcul complet via get_full_stats → mise à jour stats_global
-- (à appeler une fois pour sync initial)
WITH fresh AS (
  SELECT
    (SELECT COUNT(*) FROM plaintes) AS total,
    (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes) AS servers,
    (SELECT COUNT(*) FROM profiles) AS users,
    (SELECT COUNT(*) FROM plaintes WHERE created_at >= date_trunc('day', now())) AS today,
    (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée') AS won
)
UPDATE stats_global SET
  total_count  = fresh.total,
  server_count = fresh.servers,
  user_count   = fresh.users,
  today_count  = fresh.today,
  won_count    = fresh.won,
  updated_at   = now()
FROM fresh
WHERE stats_global.id = 1;
