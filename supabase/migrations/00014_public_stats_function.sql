-- Fonction publique pour les stats homepage — contourne RLS pour lecture agrégée anonyme
CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total',   (SELECT COUNT(*) FROM plaintes),
    'servers', (SELECT COUNT(DISTINCT game_server_name) FROM plaintes),
    'users',   (SELECT COUNT(*) FROM profiles),
    'today',   (SELECT COUNT(*) FROM plaintes
                WHERE created_at >= NOW() - INTERVAL '24 hours')
  );
$$;

-- Accès public (anon + authenticated)
GRANT EXECUTE ON FUNCTION get_public_stats() TO anon, authenticated;
