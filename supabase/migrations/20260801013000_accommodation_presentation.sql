BEGIN;

ALTER TABLE public.marketplace_hunts
  ADD COLUMN IF NOT EXISTS accommodations JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.marketplace_lodges
  ADD COLUMN IF NOT EXISTS standalone_page BOOLEAN NOT NULL DEFAULT FALSE;

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
  outfitter.inquiry AS outfitter_inquiry,
  hunt.accommodations
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
  outfitter.profile_url AS outfitter_profile_url,
  lodge.standalone_page
FROM public.marketplace_lodges AS lodge
JOIN public.marketplace_outfitters AS outfitter
  ON outfitter.source_id = lodge.source_id
WHERE lodge.published = TRUE
  AND outfitter.published = TRUE;

COMMIT;
