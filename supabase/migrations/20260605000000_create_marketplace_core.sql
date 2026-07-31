CREATE TABLE IF NOT EXISTS public.marketplace_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content_feed_url TEXT NOT NULL,
  publishing_feed_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.marketplace_sources(source_id) ON DELETE CASCADE,
  hunt_type_id UUID NOT NULL,
  slug TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  primary_species TEXT[] NOT NULL DEFAULT '{}',
  secondary_species TEXT[] NOT NULL DEFAULT '{}',
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  duration JSONB NOT NULL DEFAULT '{}'::jsonb,
  season JSONB NOT NULL DEFAULT '{}'::jsonb,
  starting_price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_content JSONB,
  content_hash TEXT NOT NULL,
  content_updated_at TIMESTAMPTZ NOT NULL,
  marketplace_status TEXT NOT NULL DEFAULT 'draft',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, hunt_type_id),
  UNIQUE (source_id, slug)
);

CREATE TABLE IF NOT EXISTS public.marketplace_hunt_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL REFERENCES public.marketplace_hunts(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  mirrored_url TEXT,
  alt TEXT NOT NULL,
  caption TEXT,
  role TEXT NOT NULL DEFAULT 'gallery',
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_checked_at TIMESTAMPTZ,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hunt_id, source_url)
);

CREATE TABLE IF NOT EXISTS public.marketplace_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT REFERENCES public.marketplace_sources(source_id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  hunts_seen INTEGER NOT NULL DEFAULT 0,
  hunts_changed INTEGER NOT NULL DEFAULT 0,
  media_changed INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_marketplace_hunts_published
  ON public.marketplace_hunts(published, trip_type, country, region);

CREATE INDEX IF NOT EXISTS idx_marketplace_hunt_media_hunt
  ON public.marketplace_hunt_media(hunt_id, role, sort_order);
