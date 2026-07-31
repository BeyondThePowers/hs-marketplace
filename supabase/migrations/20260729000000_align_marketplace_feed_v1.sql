BEGIN;

ALTER TABLE public.marketplace_sources
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS feed_schema_version TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMPTZ;

ALTER TABLE public.marketplace_hunts
  RENAME COLUMN hunt_type_id TO portal_hunt_type_id;

ALTER TABLE public.marketplace_hunts
  RENAME COLUMN canonical_url TO source_url;

ALTER TABLE public.marketplace_hunts
  ALTER COLUMN portal_hunt_type_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS listing_id UUID,
  ADD COLUMN IF NOT EXISTS content_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS central_moderation_status TEXT NOT NULL DEFAULT 'pending_review';

UPDATE public.marketplace_hunts
SET listing_id = id
WHERE listing_id IS NULL;

ALTER TABLE public.marketplace_hunts
  ALTER COLUMN listing_id SET NOT NULL;

ALTER TABLE public.marketplace_hunts
  DROP CONSTRAINT IF EXISTS marketplace_hunts_source_id_hunt_type_id_key;

ALTER TABLE public.marketplace_hunts
  ADD CONSTRAINT marketplace_hunts_content_status_check
    CHECK (content_status IN ('draft', 'ready')),
  ADD CONSTRAINT marketplace_hunts_central_moderation_status_check
    CHECK (
      central_moderation_status IN (
        'pending_review',
        'approved',
        'rejected',
        'suspended'
      )
    ),
  ADD CONSTRAINT marketplace_hunts_source_listing_key
    UNIQUE (source_id, listing_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_hunts_source_portal_hunt
  ON public.marketplace_hunts(source_id, portal_hunt_type_id)
  WHERE portal_hunt_type_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.marketplace_outfitters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL UNIQUE
    REFERENCES public.marketplace_sources(source_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  summary TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  inquiry_url TEXT NOT NULL,
  logo JSONB NOT NULL,
  profile_image JSONB NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  founded INTEGER,
  headquarters TEXT,
  public_contact JSONB,
  social_urls TEXT[] NOT NULL DEFAULT '{}',
  content_hash TEXT NOT NULL,
  content_updated_at TIMESTAMPTZ NOT NULL,
  central_moderation_status TEXT NOT NULL DEFAULT 'pending_review',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_outfitters_moderation_status_check
    CHECK (
      central_moderation_status IN (
        'pending_review',
        'approved',
        'rejected',
        'suspended'
      )
    )
);

CREATE TABLE IF NOT EXISTS public.marketplace_source_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL
    REFERENCES public.marketplace_sources(source_id) ON DELETE CASCADE,
  schema_version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted BOOLEAN NOT NULL DEFAULT false,
  validation_errors JSONB,
  UNIQUE (source_id, content_hash)
);

CREATE TABLE IF NOT EXISTS public.marketplace_sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID
    REFERENCES public.marketplace_sync_runs(id) ON DELETE CASCADE,
  source_id TEXT
    REFERENCES public.marketplace_sources(source_id) ON DELETE CASCADE,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  record_type TEXT,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_outfitters_published
  ON public.marketplace_outfitters(published, central_moderation_status);

CREATE INDEX IF NOT EXISTS idx_marketplace_source_snapshots_source
  ON public.marketplace_source_snapshots(source_id, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_sync_errors_source
  ON public.marketplace_sync_errors(source_id, created_at DESC);

COMMIT;
