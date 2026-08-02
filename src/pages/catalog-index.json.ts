import type { APIRoute } from 'astro';
import { loadCatalogSnapshot, mediaUrl } from '../lib/catalog-build';

export const prerender = true;

export const GET: APIRoute = async () => {
  const catalog = await loadCatalogSnapshot();
  const firstMedia = new Map<string, (typeof catalog.huntMedia)[number]>();
  for (const item of catalog.huntMedia) {
    if (item.hunt_id && !firstMedia.has(item.hunt_id)) firstMedia.set(item.hunt_id, item);
  }

  const body = {
    schemaVersion: '1.0',
    revision: catalog.revision,
    generatedAt: catalog.generatedAt,
    hunts: catalog.hunts.map((hunt) => ({
      listingId: hunt.listing_id,
      title: hunt.title,
      summary: hunt.summary,
      outfitter: hunt.outfitter_name,
      country: hunt.country,
      region: hunt.region,
      species: hunt.primary_species ?? [],
      tripType: hunt.trip_type,
      startingPrice: hunt.starting_price,
      currency: hunt.currency,
      image: hunt.id ? mediaUrl(firstMedia.get(hunt.id)) : null,
      url: `/hunts/${hunt.listing_id}`,
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
