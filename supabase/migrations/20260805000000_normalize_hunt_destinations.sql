BEGIN;

DROP VIEW IF EXISTS public.marketplace_public_hunts;

ALTER TABLE public.marketplace_hunts
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS location;

CREATE TABLE public.marketplace_hunt_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL REFERENCES public.marketplace_hunts(id) ON DELETE CASCADE,
  country_key TEXT NOT NULL,
  country_name TEXT NOT NULL,
  region_key TEXT NOT NULL,
  region_name TEXT NOT NULL,
  privacy_mode TEXT NOT NULL CHECK (privacy_mode IN ('exact', 'approximate', 'hidden')),
  coordinates JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hunt_id, country_key, region_key)
);

CREATE INDEX marketplace_hunt_destinations_country_idx
  ON public.marketplace_hunt_destinations(country_key, hunt_id);
CREATE INDEX marketplace_hunt_destinations_region_idx
  ON public.marketplace_hunt_destinations(country_key, region_key, hunt_id);

ALTER TABLE public.marketplace_hunt_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_hunt_destinations_service_all
  ON public.marketplace_hunt_destinations
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY marketplace_hunt_destinations_public_select
  ON public.marketplace_hunt_destinations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.marketplace_hunts AS hunt
      WHERE hunt.id = marketplace_hunt_destinations.hunt_id
        AND hunt.published = TRUE
    )
  );

GRANT SELECT ON public.marketplace_hunt_destinations TO anon, authenticated;
GRANT ALL ON public.marketplace_hunt_destinations TO service_role;

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
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'country', jsonb_build_object('key', destination.country_key, 'name', destination.country_name),
      'region', jsonb_build_object('key', destination.region_key, 'name', destination.region_name),
      'privacyMode', destination.privacy_mode,
      'coordinates', destination.coordinates
    ) ORDER BY destination.sort_order, destination.id)
    FROM public.marketplace_hunt_destinations AS destination
    WHERE destination.hunt_id = hunt.id
  ), '[]'::jsonb) AS destinations,
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
  outfitter.inquiry AS outfitter_inquiry,
  hunt.accommodations
FROM public.marketplace_hunts AS hunt
JOIN public.marketplace_outfitters AS outfitter
  ON outfitter.source_id = hunt.source_id
WHERE hunt.published = TRUE
  AND outfitter.published = TRUE;

GRANT SELECT ON public.marketplace_public_hunts TO anon, authenticated;

COMMIT;
