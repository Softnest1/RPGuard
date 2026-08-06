
-- Ajouter le compteur de plaintes validées dans get_public_stats
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total',   (SELECT COUNT(*) FROM plaintes),
    'servers', (SELECT COUNT(DISTINCT game_server_name) FROM plaintes),
    'users',   (SELECT COUNT(*) FROM profiles),
    'today',   (SELECT COUNT(*) FROM plaintes
                WHERE created_at >= NOW() - INTERVAL '24 hours'),
    'won',     (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée')
  );
$$;
