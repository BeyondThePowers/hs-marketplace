import { publicSlug } from './public-slugs';

export type PublicDestination = {
  country: { key: string; name: string };
  region: { key: string; name: string };
  privacyMode: 'exact' | 'approximate' | 'hidden';
  coordinates?: { latitude: number; longitude: number } | null;
};

const joinNames = (names: string[]) => names.length < 2
  ? names[0] ?? ''
  : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

export function huntDestinations(value: unknown): PublicDestination[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PublicDestination => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const destination = item as Record<string, any>;
    return Boolean(destination.country?.key && destination.country?.name && destination.region?.key && destination.region?.name);
  });
}

export function destinationLabel(destinations: PublicDestination[]): string {
  const countries = [...new Set(destinations.map(({ country }) => country.name))];
  if (countries.length === 1) {
    return `${joinNames(destinations.map(({ region }) => region.name))}, ${countries[0]}`;
  }
  return joinNames(destinations.map(({ country, region }) => `${region.name}, ${country.name}`));
}

export const destinationFacetKey = ({ country, region }: PublicDestination) => `${country.key}:${region.key}`;
export const destinationSlug = ({ country, region }: PublicDestination) => publicSlug(`${region.key}-${country.key}`);
