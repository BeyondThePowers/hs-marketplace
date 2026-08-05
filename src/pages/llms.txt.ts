import type { APIRoute } from 'astro';
import { loadCatalogSnapshot } from '../lib/catalog-build';
import { publicSlug } from '../lib/public-slugs';
import { destinationSlug, huntDestinations } from '../lib/hunt-destinations';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const catalog = await loadCatalogSnapshot();
  const destinations = [...new Map(catalog.hunts
    .flatMap((hunt) => huntDestinations(hunt.destinations))
    .map((destination) => [`${destination.country.key}:${destination.region.key}`, destination])).values()];
  const species = [...new Set(catalog.hunts.flatMap((hunt) => [...(hunt.primary_species ?? []), ...(hunt.secondary_species ?? [])]))].sort();
  const absolute = (path: string) => new URL(path, site).toString();
  const lines = [
    '# HuntSeeker Marketplace',
    '',
    '> Hunt packages published by participating outfitters, with structured pricing, timing, methods, accommodations, travel, equipment, terms, and direct inquiry routes.',
    '',
    '## Canonical data',
    '',
    `- [Structured public catalog](${absolute('/catalog-index.json')})`,
    `- [XML sitemap](${absolute('/sitemap-index.xml')})`,
    '',
    '## Destinations',
    '',
    ...destinations.map((destination) => `- [Hunting in ${destination.region.name}, ${destination.country.name}](${absolute(`/destinations/${destinationSlug(destination)}`)})`),
    '',
    '## Species',
    '',
    ...species.map((name) => `- [${name} hunts](${absolute(`/species/${publicSlug(name)}`)})`),
    '',
    '## Current hunts',
    '',
    ...catalog.hunts.map((hunt) => `- [${hunt.title}](${absolute(`/hunts/${hunt.listing_id}`)}): ${hunt.summary}`),
    '',
    'Pricing and availability are supplied by each outfitter and should be confirmed through the inquiry route on the hunt page.',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
};
