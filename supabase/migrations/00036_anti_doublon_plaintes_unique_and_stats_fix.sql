-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 00036 — Anti-doublon plaintes + stats sync fiable
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Index unicité simple : même user + même serveur (normalisé) + même admin ──
-- Empêche un même utilisateur de soumettre deux plaintes identiques
-- (même serveur, même admin) quel que soit le moment.
-- La normalisation lower/trim évite "Mon Serveur" ≠ "mon serveur"
CREATE UNIQUE INDEX IF NOT EXISTS idx_plaintes_no_duplicate
  ON plaintes (
    user_id,
    lower(trim(game_server_name)),
    lower(trim(admin_name))
  );

-- ── 2. Supprimer la fonction increment_stats_counter (doublon du trigger) ──
-- Le trigger trg_sync_stats_on_plainte fait déjà un COUNT(*) exact sur chaque
-- INSERT/UPDATE/DELETE. L'appel RPC fire-and-forget depuis le frontend crée
-- un écart temporaire (race condition) et des doubles incréments.
DROP FUNCTION IF EXISTS increment_stats_counter(text);

-- ── 3. Remplacer sync_stats_on_plainte_change — version complète ──
CREATE OR REPLACE FUNCTION sync_stats_on_plainte_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stats_global SET
    total_count  = (SELECT COUNT(*)                              FROM plaintes),
    server_count = (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
    today_count  = (SELECT COUNT(*) FROM plaintes
                    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
    won_count    = (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
    updated_at   = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$;

-- ── 4. Resync immédiate des stats ──
UPDATE stats_global SET
  total_count  = (SELECT COUNT(*)                              FROM plaintes),
  server_count = (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
  today_count  = (SELECT COUNT(*) FROM plaintes
                  WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
  won_count    = (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
  updated_at   = now()
WHERE id = 1;