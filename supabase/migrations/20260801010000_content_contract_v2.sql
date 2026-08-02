BEGIN;

ALTER TABLE public.marketplace_sources
  ADD COLUMN IF NOT EXISTS last_accepted_content_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_accepted_at TIMESTAMPTZ;

ALTER TABLE public.marketplace_outfitters
  ADD COLUMN IF NOT EXISTS public_id UUID,
  ADD COLUMN IF NOT EXISTS inquiry JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_content JSONB;

UPDATE public.marketplace_outfitters
SET public_id = source_id::UUID
WHERE public_id IS NULL;

ALTER TABLE public.marketplace_outfitters
  ALTER COLUMN public_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_outfitters_public_id
  ON public.marketplace_outfitters(public_id);

ALTER TABLE public.marketplace_hunts
  ADD COLUMN IF NOT EXISTS classification JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS location JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS duration_and_party JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS season_and_availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS methods_and_guiding JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS territory JSONB,
  ADD COLUMN IF NOT EXISTS travel JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS equipment_and_licenses JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optional_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS editorial JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.marketplace_lodges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL
    REFERENCES public.marketplace_sources(source_id) ON DELETE CASCADE,
  lodge_id UUID NOT NULL,
  slug TEXT NOT NULL,
  source_url TEXT NOT NULL,
  name TEXT NOT NULL,
  classification TEXT,
  atmosphere_line TEXT,
  summary TEXT NOT NULL,
  publication_scope TEXT NOT NULL DEFAULT 'full',
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  arrival JSONB,
  capacity JSONB NOT NULL DEFAULT '{}'::jsonb,
  rooms JSONB,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  dining JSONB,
  service JSONB,
  suitability JSONB,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_content JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  content_updated_at TIMESTAMPTZ NOT NULL,
  source_active BOOLEAN NOT NULL DEFAULT TRUE,
  central_moderation_status TEXT NOT NULL DEFAULT 'pending_review',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  orphaned_at TIMESTAMPTZ,
  moderation_changed_at TIMESTAMPTZ,
  moderation_changed_by TEXT,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, lodge_id),
  UNIQUE (source_id, slug),
  CONSTRAINT marketplace_lodges_publication_scope_check
    CHECK (publication_scope IN ('full', 'summary', 'private')),
  CONSTRAINT marketplace_lodges_moderation_status_check
    CHECK (central_moderation_status IN ('pending_review', 'approved', 'rejected', 'suspended'))
);

CREATE TABLE IF NOT EXISTS public.marketplace_hunt_lodges (
  hunt_id UUID NOT NULL
    REFERENCES public.marketplace_hunts(id) ON DELETE CASCADE,
  lodge_record_id UUID NOT NULL
    REFERENCES public.marketplace_lodges(id) ON DELETE CASCADE,
  region_key TEXT NOT NULL,
  region_name TEXT NOT NULL,
  usage TEXT NOT NULL,
  included_nights INTEGER,
  summary TEXT,
  transfer_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (hunt_id, lodge_record_id, region_key),
  CONSTRAINT marketplace_hunt_lodges_usage_check
    CHECK (usage IN ('guaranteed', 'one-of-several', 'optional', 'partial-stay')),
  CONSTRAINT marketplace_hunt_lodges_nights_check
    CHECK (included_nights IS NULL OR included_nights >= 0)
);

CREATE TABLE IF NOT EXISTS public.marketplace_lodge_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lodge_record_id UUID NOT NULL
    REFERENCES public.marketplace_lodges(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  mirrored_url TEXT,
  alt TEXT NOT NULL,
  caption TEXT,
  role TEXT NOT NULL DEFAULT 'gallery',
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_hash TEXT,
  status TEXT NOT NULL DEFAULT 'source',
  last_checked_at TIMESTAMPTZ,
  last_downloaded_at TIMESTAMPTZ,
  orphaned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lodge_record_id, source_url)
);

CREATE TABLE IF NOT EXISTS public.marketplace_publication_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_hash TEXT NOT NULL UNIQUE,
  changed_source_ids TEXT[] NOT NULL DEFAULT '{}',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  build_status TEXT NOT NULL DEFAULT 'pending',
  build_requested_at TIMESTAMPTZ,
  build_started_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  deployment_id TEXT,
  deployment_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_publication_revisions_build_status_check
    CHECK (build_status IN ('pending', 'requested', 'building', 'deployed', 'verified', 'failed'))
);

ALTER TABLE public.marketplace_sync_runs
  ADD COLUMN IF NOT EXISTS lodges_seen INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lodges_changed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_content_hash TEXT,
  ADD COLUMN IF NOT EXISTS publication_revision_id UUID
    REFERENCES public.marketplace_publication_revisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_lodges_public
  ON public.marketplace_lodges(published, source_id, slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_hunt_lodges_hunt
  ON public.marketplace_hunt_lodges(hunt_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_lodge_media_lodge
  ON public.marketplace_lodge_media(lodge_record_id, role, sort_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_publication_revisions_accepted
  ON public.marketplace_publication_revisions(accepted_at DESC);

CREATE OR REPLACE FUNCTION public.marketplace_set_lodge_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.published := (
    NEW.source_active = TRUE
    AND NEW.orphaned_at IS NULL
    AND NEW.publication_scope <> 'private'
    AND NEW.central_moderation_status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.marketplace_sources AS source
      WHERE source.source_id = NEW.source_id
        AND source.participation_status = 'active'
        AND source.feed_enabled = TRUE
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_set_lodge_publication_trigger
  ON public.marketplace_lodges;
CREATE TRIGGER marketplace_set_lodge_publication_trigger
BEFORE INSERT OR UPDATE OF
  source_id,
  source_active,
  orphaned_at,
  publication_scope,
  central_moderation_status,
  published
ON public.marketplace_lodges
FOR EACH ROW
EXECUTE FUNCTION public.marketplace_set_lodge_publication();

ALTER TABLE public.marketplace_lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_hunt_lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_lodge_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_publication_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_public_read_lodges ON public.marketplace_lodges;
CREATE POLICY marketplace_public_read_lodges
ON public.marketplace_lodges
FOR SELECT
TO anon, authenticated
USING (published = TRUE AND source_active = TRUE AND orphaned_at IS NULL);

DROP POLICY IF EXISTS marketplace_public_read_hunt_lodges ON public.marketplace_hunt_lodges;
CREATE POLICY marketplace_public_read_hunt_lodges
ON public.marketplace_hunt_lodges
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_hunts AS hunt
    WHERE hunt.id = marketplace_hunt_lodges.hunt_id AND hunt.published = TRUE
  )
  AND EXISTS (
    SELECT 1 FROM public.marketplace_lodges AS lodge
    WHERE lodge.id = marketplace_hunt_lodges.lodge_record_id AND lodge.published = TRUE
  )
);

DROP POLICY IF EXISTS marketplace_public_read_lodge_media ON public.marketplace_lodge_media;
CREATE POLICY marketplace_public_read_lodge_media
ON public.marketplace_lodge_media
FOR SELECT
TO anon, authenticated
USING (
  status <> 'orphaned'
  AND orphaned_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.marketplace_lodges AS lodge
    WHERE lodge.id = marketplace_lodge_media.lodge_record_id AND lodge.published = TRUE
  )
);

CREATE OR REPLACE VIEW public.marketplace_public_outfitters
WITH (security_invoker = TRUE)
AS
SELECT
  outfitter.id,
  outfitter.source_id,
  outfitter.name,
  outfitter.tagline,
  outfitter.summary,
  outfitter.profile_url,
  outfitter.inquiry_url,
  outfitter.logo,
  outfitter.profile_image,
  outfitter.countries,
  outfitter.regions,
  outfitter.founded,
  outfitter.headquarters,
  outfitter.public_contact,
  outfitter.social_urls,
  outfitter.content_updated_at,
  outfitter.public_id,
  outfitter.inquiry
FROM public.marketplace_outfitters AS outfitter
WHERE outfitter.published = TRUE;

CREATE OR REPLACE VIEW public.marketplace_public_hunts
WITH (security_invoker = TRUE)
AS
SELECT
  hunt.id,
  hunt.source_id,
  hunt.listing_id,
  hunt.slug,
  hunt.source_url,
  hunt.title,
  hunt.summary,
  hunt.trip_type,
  hunt.primary_species,
  hunt.secondary_species,
  hunt.country,
  hunt.region,
  hunt.duration,
  hunt.season,
  hunt.starting_price,
  hunt.currency,
  hunt.sections,
  hunt.content_updated_at,
  outfitter.name AS outfitter_name,
  outfitter.profile_url AS outfitter_profile_url,
  outfitter.inquiry_url AS outfitter_inquiry_url,
  hunt.classification,
  hunt.location,
  hunt.duration_and_party,
  hunt.season_and_availability,
  hunt.methods_and_guiding,
  hunt.pricing,
  hunt.territory,
  hunt.travel,
  hunt.equipment_and_licenses,
  hunt.inclusions,
  hunt.exclusions,
  hunt.optional_services,
  hunt.terms,
  hunt.itinerary,
  hunt.faqs,
  hunt.editorial,
  outfitter.inquiry AS outfitter_inquiry
FROM public.marketplace_hunts AS hunt
JOIN public.marketplace_outfitters AS outfitter
  ON outfitter.source_id = hunt.source_id
WHERE hunt.published = TRUE
  AND outfitter.published = TRUE;

CREATE OR REPLACE VIEW public.marketplace_public_lodges
WITH (security_invoker = TRUE)
AS
SELECT
  lodge.id,
  lodge.source_id,
  lodge.lodge_id,
  lodge.slug,
  lodge.source_url,
  lodge.name,
  lodge.classification,
  lodge.atmosphere_line,
  lodge.summary,
  lodge.publication_scope,
  lodge.location,
  lodge.arrival,
  lodge.capacity,
  lodge.rooms,
  lodge.amenities,
  lodge.dining,
  lodge.service,
  lodge.suitability,
  lodge.highlights,
  lodge.faqs,
  lodge.content_updated_at,
  outfitter.name AS outfitter_name,
  outfitter.profile_url AS outfitter_profile_url
FROM public.marketplace_lodges AS lodge
JOIN public.marketplace_outfitters AS outfitter
  ON outfitter.source_id = lodge.source_id
WHERE lodge.published = TRUE
  AND outfitter.published = TRUE;

CREATE OR REPLACE VIEW public.marketplace_public_hunt_lodges
WITH (security_invoker = TRUE)
AS
SELECT
  relation.hunt_id,
  relation.lodge_record_id,
  relation.region_key,
  relation.region_name,
  relation.usage,
  relation.included_nights,
  relation.summary,
  relation.transfer_notes,
  relation.sort_order
FROM public.marketplace_hunt_lodges AS relation;

CREATE OR REPLACE VIEW public.marketplace_public_lodge_media
WITH (security_invoker = TRUE)
AS
SELECT
  media.id,
  media.lodge_record_id,
  media.source_url,
  media.mirrored_url,
  media.alt,
  media.caption,
  media.role,
  media.sort_order
FROM public.marketplace_lodge_media AS media
WHERE media.status <> 'orphaned'
  AND media.orphaned_at IS NULL;

REVOKE SELECT ON public.marketplace_lodges FROM anon, authenticated;
REVOKE SELECT ON public.marketplace_hunt_lodges FROM anon, authenticated;
REVOKE SELECT ON public.marketplace_lodge_media FROM anon, authenticated;
REVOKE SELECT ON public.marketplace_publication_revisions FROM anon, authenticated;

GRANT SELECT (public_id, inquiry)
ON public.marketplace_outfitters TO anon, authenticated;

GRANT SELECT (
  classification, location, duration_and_party, season_and_availability,
  methods_and_guiding, pricing, territory, travel, equipment_and_licenses,
  inclusions, exclusions, optional_services, terms, itinerary, faqs, editorial
) ON public.marketplace_hunts TO anon, authenticated;

GRANT SELECT (
  id, source_id, lodge_id, slug, source_url, name, classification,
  atmosphere_line, summary, publication_scope, location, arrival, capacity,
  rooms, amenities, dining, service, suitability, highlights, faqs,
  content_updated_at, published, source_active, orphaned_at
) ON public.marketplace_lodges TO anon, authenticated;

GRANT SELECT (
  hunt_id, lodge_record_id, region_key, region_name, usage, included_nights,
  summary, transfer_notes, sort_order
) ON public.marketplace_hunt_lodges TO anon, authenticated;

GRANT SELECT (
  id, lodge_record_id, source_url, mirrored_url, alt, caption, role, sort_order,
  status, orphaned_at
) ON public.marketplace_lodge_media TO anon, authenticated;

GRANT SELECT ON public.marketplace_public_lodges TO anon, authenticated;
GRANT SELECT ON public.marketplace_public_hunt_lodges TO anon, authenticated;
GRANT SELECT ON public.marketplace_public_lodge_media TO anon, authenticated;

COMMIT;
