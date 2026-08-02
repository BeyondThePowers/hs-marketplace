BEGIN;

ALTER TABLE public.marketplace_sources
  ADD COLUMN IF NOT EXISTS participation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS consent_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_recorded_by TEXT,
  ADD COLUMN IF NOT EXISTS participation_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS participation_reason TEXT;

UPDATE public.marketplace_sources
SET
  participation_status = CASE WHEN enabled THEN 'active' ELSE 'pending' END,
  consent_confirmed_at = CASE WHEN enabled THEN COALESCE(consent_confirmed_at, created_at) ELSE consent_confirmed_at END,
  consent_recorded_by = CASE WHEN enabled THEN COALESCE(consent_recorded_by, 'legacy-enabled-source') ELSE consent_recorded_by END,
  participation_changed_at = COALESCE(updated_at, created_at, NOW());

ALTER TABLE public.marketplace_sources
  ADD CONSTRAINT marketplace_sources_participation_status_check
    CHECK (participation_status IN ('pending', 'active', 'paused', 'withdrawn')),
  ADD CONSTRAINT marketplace_sources_active_consent_check
    CHECK (
      participation_status <> 'active'
      OR (consent_confirmed_at IS NOT NULL AND NULLIF(BTRIM(consent_recorded_by), '') IS NOT NULL)
    );

COMMENT ON COLUMN public.marketplace_sources.enabled IS
  'Deprecated compatibility mirror. participation_status is the authoritative marketplace control.';
COMMENT ON COLUMN public.marketplace_sources.participation_status IS
  'Marketplace-controlled consent and participation state.';
COMMENT ON COLUMN public.marketplace_sources.feed_enabled IS
  'Outfitter-controlled participation signal from the most recently accepted marketing feed.';
COMMENT ON COLUMN public.marketplace_sources.webhook_secret_hash IS
  'Optional deploy notification credential. Scheduled pull reconciliation does not require it.';

CREATE OR REPLACE FUNCTION public.marketplace_sync_legacy_source_enabled()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.enabled := NEW.participation_status = 'active';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_sync_legacy_source_enabled_trigger
  ON public.marketplace_sources;
CREATE TRIGGER marketplace_sync_legacy_source_enabled_trigger
BEFORE INSERT OR UPDATE OF participation_status
ON public.marketplace_sources
FOR EACH ROW
EXECUTE FUNCTION public.marketplace_sync_legacy_source_enabled();

CREATE OR REPLACE FUNCTION public.marketplace_refresh_publication_for_source(
  target_source_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_outfitters AS outfitter
  SET
    published = (
      outfitter.central_moderation_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_sources AS source
        WHERE source.source_id = target_source_id
          AND source.participation_status = 'active'
          AND source.feed_enabled = TRUE
      )
    ),
    updated_at = NOW()
  WHERE outfitter.source_id = target_source_id;

  UPDATE public.marketplace_hunts AS hunt
  SET
    published = (
      hunt.source_active = TRUE
      AND hunt.orphaned_at IS NULL
      AND hunt.content_status = 'ready'
      AND hunt.central_moderation_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_sources AS source
        WHERE source.source_id = target_source_id
          AND source.participation_status = 'active'
          AND source.feed_enabled = TRUE
      )
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_outfitters AS outfitter
        WHERE outfitter.source_id = target_source_id
          AND outfitter.central_moderation_status = 'approved'
      )
    ),
    updated_at = NOW()
  WHERE hunt.source_id = target_source_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_refresh_publication_after_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.marketplace_refresh_publication_for_source(NEW.source_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_refresh_publication_after_source_trigger
  ON public.marketplace_sources;
CREATE TRIGGER marketplace_refresh_publication_after_source_trigger
AFTER INSERT OR UPDATE OF participation_status, feed_enabled
ON public.marketplace_sources
FOR EACH ROW
EXECUTE FUNCTION public.marketplace_refresh_publication_after_source();

CREATE OR REPLACE FUNCTION public.marketplace_set_hunt_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.published := (
    NEW.source_active = TRUE
    AND NEW.orphaned_at IS NULL
    AND NEW.content_status = 'ready'
    AND NEW.central_moderation_status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.marketplace_sources AS source
      WHERE source.source_id = NEW.source_id
        AND source.participation_status = 'active'
        AND source.feed_enabled = TRUE
    )
    AND EXISTS (
      SELECT 1
      FROM public.marketplace_outfitters AS outfitter
      WHERE outfitter.source_id = NEW.source_id
        AND outfitter.central_moderation_status = 'approved'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_set_hunt_publication_trigger
  ON public.marketplace_hunts;
CREATE TRIGGER marketplace_set_hunt_publication_trigger
BEFORE INSERT OR UPDATE OF
  source_id,
  source_active,
  orphaned_at,
  content_status,
  central_moderation_status,
  published
ON public.marketplace_hunts
FOR EACH ROW
EXECUTE FUNCTION public.marketplace_set_hunt_publication();

CREATE OR REPLACE FUNCTION public.marketplace_set_outfitter_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.published := (
    NEW.central_moderation_status = 'approved'
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

DROP TRIGGER IF EXISTS marketplace_set_outfitter_publication_trigger
  ON public.marketplace_outfitters;
CREATE TRIGGER marketplace_set_outfitter_publication_trigger
BEFORE INSERT OR UPDATE OF
  source_id,
  central_moderation_status,
  published
ON public.marketplace_outfitters
FOR EACH ROW
EXECUTE FUNCTION public.marketplace_set_outfitter_publication();

CREATE OR REPLACE FUNCTION public.marketplace_refresh_publication_after_outfitter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.marketplace_refresh_publication_for_source(NEW.source_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_refresh_publication_after_outfitter_trigger
  ON public.marketplace_outfitters;
CREATE TRIGGER marketplace_refresh_publication_after_outfitter_trigger
AFTER INSERT OR UPDATE OF central_moderation_status
ON public.marketplace_outfitters
FOR EACH ROW
EXECUTE FUNCTION public.marketplace_refresh_publication_after_outfitter();

CREATE OR REPLACE FUNCTION public.set_marketplace_source_participation(
  target_source_id TEXT,
  new_status TEXT,
  recorded_by TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS public.marketplace_sources
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_source public.marketplace_sources;
BEGIN
  IF new_status NOT IN ('pending', 'active', 'paused', 'withdrawn') THEN
    RAISE EXCEPTION 'Invalid marketplace participation status';
  END IF;
  IF NULLIF(BTRIM(recorded_by), '') IS NULL THEN
    RAISE EXCEPTION 'A participation change requires an operator identity';
  END IF;

  UPDATE public.marketplace_sources
  SET
    participation_status = new_status,
    consent_confirmed_at = CASE
      WHEN new_status = 'active' THEN COALESCE(consent_confirmed_at, NOW())
      ELSE consent_confirmed_at
    END,
    consent_recorded_by = CASE
      WHEN new_status = 'active' THEN COALESCE(consent_recorded_by, BTRIM(recorded_by))
      ELSE consent_recorded_by
    END,
    participation_changed_at = NOW(),
    participation_reason = NULLIF(BTRIM(reason), ''),
    updated_at = NOW()
  WHERE source_id = target_source_id
  RETURNING * INTO updated_source;

  IF updated_source.source_id IS NULL THEN
    RAISE EXCEPTION 'Unknown marketplace source';
  END IF;

  RETURN updated_source;
END;
$$;

REVOKE ALL ON FUNCTION public.set_marketplace_source_participation(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_marketplace_source_participation(TEXT, TEXT, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.marketplace_source_is_public(
  target_source_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marketplace_sources AS source
    WHERE source.source_id = target_source_id
      AND source.participation_status = 'active'
      AND source.feed_enabled = TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.marketplace_source_is_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketplace_source_is_public(TEXT)
  TO anon, authenticated, service_role;

SELECT public.marketplace_refresh_publication_for_source(source_id)
FROM public.marketplace_sources;

ALTER TABLE public.marketplace_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_outfitters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_hunt_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sync_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_public_sources_select ON public.marketplace_sources;
CREATE POLICY marketplace_public_sources_select
ON public.marketplace_sources
FOR SELECT
TO anon, authenticated
USING (participation_status = 'active' AND feed_enabled = TRUE);

DROP POLICY IF EXISTS marketplace_public_outfitters_select ON public.marketplace_outfitters;
CREATE POLICY marketplace_public_outfitters_select
ON public.marketplace_outfitters
FOR SELECT
TO anon, authenticated
USING (
  central_moderation_status = 'approved'
  AND published = TRUE
  AND public.marketplace_source_is_public(marketplace_outfitters.source_id)
);

DROP POLICY IF EXISTS marketplace_public_hunts_select ON public.marketplace_hunts;
CREATE POLICY marketplace_public_hunts_select
ON public.marketplace_hunts
FOR SELECT
TO anon, authenticated
USING (
  published = TRUE
  AND source_active = TRUE
  AND orphaned_at IS NULL
  AND content_status = 'ready'
  AND central_moderation_status = 'approved'
  AND public.marketplace_source_is_public(marketplace_hunts.source_id)
  AND EXISTS (
    SELECT 1
    FROM public.marketplace_outfitters AS outfitter
    WHERE outfitter.source_id = marketplace_hunts.source_id
      AND outfitter.central_moderation_status = 'approved'
      AND outfitter.published = TRUE
  )
);

DROP POLICY IF EXISTS marketplace_public_media_select ON public.marketplace_hunt_media;
CREATE POLICY marketplace_public_media_select
ON public.marketplace_hunt_media
FOR SELECT
TO anon, authenticated
USING (
  status <> 'orphaned'
  AND orphaned_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.marketplace_hunts AS hunt
    WHERE hunt.id = marketplace_hunt_media.hunt_id
      AND hunt.published = TRUE
      AND hunt.source_active = TRUE
      AND hunt.orphaned_at IS NULL
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
  outfitter.content_updated_at
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
  outfitter.inquiry_url AS outfitter_inquiry_url
FROM public.marketplace_hunts AS hunt
JOIN public.marketplace_outfitters AS outfitter
  ON outfitter.source_id = hunt.source_id
WHERE hunt.published = TRUE
  AND outfitter.published = TRUE;

CREATE OR REPLACE VIEW public.marketplace_public_hunt_media
WITH (security_invoker = TRUE)
AS
SELECT
  media.id,
  media.hunt_id,
  media.source_url,
  media.mirrored_url,
  media.alt,
  media.caption,
  media.role,
  media.sort_order
FROM public.marketplace_hunt_media AS media
WHERE media.status <> 'orphaned'
  AND media.orphaned_at IS NULL;

REVOKE SELECT ON public.marketplace_sources FROM anon, authenticated;
REVOKE SELECT ON public.marketplace_outfitters FROM anon, authenticated;
REVOKE SELECT ON public.marketplace_hunts FROM anon, authenticated;
REVOKE SELECT ON public.marketplace_hunt_media FROM anon, authenticated;

GRANT SELECT (
  id,
  source_id,
  name,
  tagline,
  summary,
  profile_url,
  inquiry_url,
  logo,
  profile_image,
  countries,
  regions,
  founded,
  headquarters,
  public_contact,
  social_urls,
  content_updated_at,
  central_moderation_status,
  published
) ON public.marketplace_outfitters TO anon, authenticated;

GRANT SELECT (
  id,
  source_id,
  listing_id,
  slug,
  source_url,
  title,
  summary,
  trip_type,
  primary_species,
  secondary_species,
  country,
  region,
  duration,
  season,
  starting_price,
  currency,
  sections,
  content_updated_at,
  content_status,
  central_moderation_status,
  published,
  source_active,
  orphaned_at
) ON public.marketplace_hunts TO anon, authenticated;

GRANT SELECT (
  id,
  hunt_id,
  source_url,
  mirrored_url,
  alt,
  caption,
  role,
  sort_order,
  status,
  orphaned_at
) ON public.marketplace_hunt_media TO anon, authenticated;
GRANT SELECT ON public.marketplace_public_outfitters TO anon, authenticated;
GRANT SELECT ON public.marketplace_public_hunts TO anon, authenticated;
GRANT SELECT ON public.marketplace_public_hunt_media TO anon, authenticated;

COMMIT;
