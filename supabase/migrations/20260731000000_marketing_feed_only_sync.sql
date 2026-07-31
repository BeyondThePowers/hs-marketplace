BEGIN;

ALTER TABLE public.marketplace_sources
  DROP COLUMN IF EXISTS publishing_feed_url,
  ADD COLUMN IF NOT EXISTS webhook_secret_hash TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret_hint TEXT,
  ADD COLUMN IF NOT EXISTS credential_rotated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_feed_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS feed_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.marketplace_hunts
  DROP COLUMN IF EXISTS portal_hunt_type_id,
  DROP COLUMN IF EXISTS marketplace_status,
  ADD COLUMN IF NOT EXISTS source_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS orphaned_at TIMESTAMPTZ;

DROP INDEX IF EXISTS public.idx_marketplace_hunts_source_portal_hunt;

ALTER TABLE public.marketplace_hunt_media
  ADD COLUMN IF NOT EXISTS orphaned_at TIMESTAMPTZ;

ALTER TABLE public.marketplace_sync_runs
  ADD COLUMN IF NOT EXISTS trigger_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS feed_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT marketplace_sync_runs_trigger_type_check
    CHECK (trigger_type IN ('webhook', 'scheduled', 'manual'));

ALTER TABLE public.marketplace_sources
  ADD CONSTRAINT marketplace_sources_source_id_uuid_check
    CHECK (
      source_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  ADD CONSTRAINT marketplace_sources_sync_duration_check
    CHECK (last_sync_duration_ms IS NULL OR last_sync_duration_ms >= 0),
  ADD CONSTRAINT marketplace_sources_failure_count_check
    CHECK (consecutive_failures >= 0);

CREATE INDEX IF NOT EXISTS idx_marketplace_hunts_source_health
  ON public.marketplace_hunts(source_id, source_active, orphaned_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_sync_runs_source_started
  ON public.marketplace_sync_runs(source_id, started_at DESC);

COMMIT;
