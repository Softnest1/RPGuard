
-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Indexes critiques + vues matérialisées pour 1M+ utilisateurs
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Index sur plaintes (requêtes les plus fréquentes) ─────────────────

-- Tri DESC par date (fetchPlaintes, fetchRecentPlaintes, etc.)
CREATE INDEX IF NOT EXISTS idx_plaintes_created_at_desc
  ON plaintes(created_at DESC);

-- Filtre par user_id (fetchMyPlaintes)
CREATE INDEX IF NOT EXISTS idx_plaintes_user_id
  ON plaintes(user_id);

-- Filtre par statut (fetchAdminPlaintes, filtres page plaintes)
CREATE INDEX IF NOT EXISTS idx_plaintes_status
  ON plaintes(status);

-- Combiné statut + date (pattern le plus courant: status + ORDER BY created_at)
CREATE INDEX IF NOT EXISTS idx_plaintes_status_created_at
  ON plaintes(status, created_at DESC);

-- Filtre par catégorie (fetchPlaintes avec categoryId)
CREATE INDEX IF NOT EXISTS idx_plaintes_category_id
  ON plaintes(category_id);

-- Search partiel sur nom serveur (fetchAdminPlaintes search)
CREATE INDEX IF NOT EXISTS idx_plaintes_game_server_name_lower
  ON plaintes(lower(game_server_name));

-- Search partiel sur nom admin
CREATE INDEX IF NOT EXISTS idx_plaintes_admin_name_lower
  ON plaintes(lower(admin_name));

-- ── 2. Index sur votes (upsertVote, fetchUserVote) ───────────────────────

CREATE INDEX IF NOT EXISTS idx_votes_plainte_user
  ON votes(plainte_id, user_id);

CREATE INDEX IF NOT EXISTS idx_votes_plainte_id
  ON votes(plainte_id);

-- ── 3. Index sur commentaires ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_commentaires_plainte_id
  ON commentaires(plainte_id);

-- ── 4. Index sur notifications ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, read, created_at DESC);

-- ── 5. Index sur profiles ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles(lower(username));

-- ── 6. Index sur preuves ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_preuves_plainte_id
  ON preuves(plainte_id);

-- ── 7. Index sur signalements ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_signalements_plainte_id
  ON signalements(plainte_id);

-- ── 8. Index sur messages (messagerie) ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id, created_at DESC);

-- ── 9. Fonction SQL sécurisée pour COUNT DISTINCT servers ────────────────
-- Remplace le SELECT game_server_name sans LIMIT dans fetchStats()

CREATE OR REPLACE FUNCTION count_distinct_servers()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT lower(trim(game_server_name)))
  FROM plaintes;
$$;

-- ── 10. Fonction SQL pour stats complètes en 1 seul appel ────────────────
-- Évite les 5 requêtes parallèles de fetchAdminStats()

CREATE OR REPLACE FUNCTION get_full_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total',     (SELECT COUNT(*) FROM plaintes),
    'today',     (SELECT COUNT(*) FROM plaintes WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')),
    'won',       (SELECT COUNT(*) FROM plaintes WHERE status = 'Validée'),
    'users',     (SELECT COUNT(*) FROM profiles),
    'servers',   (SELECT COUNT(DISTINCT lower(trim(game_server_name))) FROM plaintes),
    'en_attente',(SELECT COUNT(*) FROM plaintes WHERE status = 'En attente'),
    'rejetees',  (SELECT COUNT(*) FROM plaintes WHERE status = 'Rejetée'),
    'viral',     (SELECT COUNT(*) FROM plaintes WHERE status = 'Viral')
  );
$$;

-- ── 11. Index sur contact_messages ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON contact_messages(status, created_at DESC);

-- ── 12. VACUUM ANALYZE pour activer les nouveaux index immédiatement ─────
ANALYZE plaintes;
ANALYZE votes;
ANALYZE commentaires;
ANALYZE profiles;
ANALYZE notifications;
