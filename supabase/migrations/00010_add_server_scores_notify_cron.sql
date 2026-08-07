
-- ═══════════════════════════════════════════════════════════
-- 1. Table server_scores — score de réputation par serveur
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.server_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_name     TEXT NOT NULL UNIQUE,
  total_plaintes  INT NOT NULL DEFAULT 0,
  plaintes_valides INT NOT NULL DEFAULT 0,
  plaintes_viral  INT NOT NULL DEFAULT 0,
  score           INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.server_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public peut lire les scores serveurs"
  ON public.server_scores FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════
-- 2. Colonne notify_sent sur plaintes — idempotence email
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.plaintes ADD COLUMN notify_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- ═══════════════════════════════════════════════════════════
-- 3. Fonction SECURITY DEFINER : recalcule le score d'un serveur
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION recalculate_server_score(p_server_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total   INT;
  v_valides INT;
  v_viral   INT;
  v_score   INT;
BEGIN
  SELECT COUNT(*) INTO v_total
    FROM plaintes WHERE game_server_name = p_server_name;

  SELECT COUNT(*) FILTER (WHERE status = 'Validée') INTO v_valides
    FROM plaintes WHERE game_server_name = p_server_name;

  SELECT COUNT(*) FILTER (WHERE status = 'Viral') INTO v_viral
    FROM plaintes WHERE game_server_name = p_server_name;

  v_score := GREATEST(0, 100 - (v_valides * 8) - (v_viral * 15) - (v_total * 1));

  INSERT INTO public.server_scores (server_name, total_plaintes, plaintes_valides, plaintes_viral, score, updated_at)
    VALUES (p_server_name, v_total, v_valides, v_viral, v_score, NOW())
  ON CONFLICT (server_name) DO UPDATE
    SET total_plaintes   = EXCLUDED.total_plaintes,
        plaintes_valides = EXCLUDED.plaintes_valides,
        plaintes_viral   = EXCLUDED.plaintes_viral,
        score            = EXCLUDED.score,
        updated_at       = NOW();
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 4. Trigger : recalcule le score à chaque INSERT/UPDATE
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_update_server_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_server_score(NEW.game_server_name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_plainte_change_update_score
  AFTER INSERT OR UPDATE OF status ON public.plaintes
  FOR EACH ROW EXECUTE FUNCTION trigger_update_server_score();

-- ═══════════════════════════════════════════════════════════
-- 5. Fonction : passe une plainte en Viral si score >= 10
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION promote_viral_plaintes()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plainte RECORD;
  v_upvotes INT;
  v_downvotes INT;
BEGIN
  FOR v_plainte IN
    SELECT p.id FROM plaintes p WHERE p.status = 'En attente'
  LOOP
    SELECT
      COUNT(*) FILTER (WHERE vote_type = 'upvote'),
      COUNT(*) FILTER (WHERE vote_type = 'downvote')
    INTO v_upvotes, v_downvotes
    FROM votes WHERE plainte_id = v_plainte.id;

    IF (v_upvotes - v_downvotes) >= 10 THEN
      UPDATE plaintes SET status = 'Viral' WHERE id = v_plainte.id;
    END IF;
  END LOOP;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 6. pg_cron jobs
-- ═══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'check-viral-plaintes',
  '*/10 * * * *',
  $$ SELECT promote_viral_plaintes(); $$
);

SELECT cron.schedule(
  'notify-new-plaintes',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/notify-plainte',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'publishable_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Indexes performance
CREATE INDEX idx_plaintes_notify_sent ON public.plaintes (notify_sent) WHERE NOT notify_sent;
CREATE INDEX idx_server_scores_score  ON public.server_scores (score ASC);
