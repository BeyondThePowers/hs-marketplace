import type { APIRoute } from 'astro';
import { loadCatalogSnapshot, mediaUrl } from '../lib/catalog-build';
import { publicSlug } from '../lib/public-slugs';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const catalog = await loadCatalogSnapshot();
  const firstMedia = new Map<string, (typeof catalog.huntMedia)[number]>();
  for (const item of catalog.huntMedia) {
    if (item.hunt_id && !firstMedia.has(item.hunt_id)) firstMedia.set(item.hunt_id, item);
  }

  const body = {
    schemaVersion: '1.0',
    revision: catalog.revision,
    publicationRevision: catalog.publicationRevision,
    generatedAt: catalog.generatedAt,
    hunts: catalog.hunts.map((hunt) => ({
      listingId: hunt.listing_id,
      sourceId: hunt.source_id,
      title: hunt.title,
      summary: hunt.summary,
      outfitter: hunt.outfitter_name,
      country: hunt.country,
      region: hunt.region,
      species: {
        primary: hunt.primary_species ?? [],
        secondary: hunt.secondary_species ?? [],
      },
      tripType: hunt.trip_type,
      startingPrice: hunt.starting_price,
      currency: hunt.currency,
      durationAndParty: hunt.duration_and_party ?? hunt.duration,
      seasonAndAvailability: hunt.season_and_availability ?? hunt.season,
      methodsAndGuiding: hunt.methods_and_guiding,
      pricing: hunt.pricing,
      accommodations: hunt.accommodations,
      territory: hunt.territory,
      travel: hunt.travel,
      equipmentAndLicenses: hunt.equipment_and_licenses,
      inclusions: hunt.inclusions,
      exclusions: hunt.exclusions,
      optionalServices: hunt.optional_services,
      terms: hunt.terms,
      image: hunt.id ? mediaUrl(firstMedia.get(hunt.id)) : null,
      url: new URL(`/hunts/${hunt.listing_id}`, site).toString(),
      destinationUrl: new URL(`/destinations/${publicSlug(`${hunt.region}-${hunt.country}`)}`, site).toString(),
      speciesUrls: (hunt.primary_species ?? []).map((species) => new URL(`/species/${publicSlug(species)}`, site).toString()),
      sourceUrl: hunt.source_url,
    })),
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      ETag: `"${catalog.revision.replace('sha256:', '')}"`,
    },
  });
};
