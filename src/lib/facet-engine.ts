export const categoricalFacets = ['destination', 'species', 'tripType', 'equipment', 'technique', 'terrain', 'access'] as const;

export type CategoricalFacet = (typeof categoricalFacets)[number];
export type SpeciesMode = 'any' | 'all';

export type FacetRecord = {
  id: string;
  sourceId: string;
  search: CatalogSearchDocument;
  destinations: Array<{ countryKey: string; regionKey: string }>;
  species: string[];
  tripType: string;
  equipment: string[];
  techniques: string[];
  terrain: string[];
  access: string[];
  price: number | null;
  huntingDays: number;
};

export type FacetState = {
  q: string;
  countries: string[];
  regions: string[];
  species: string[];
  speciesMode: SpeciesMode;
  tripTypes: string[];
  equipment: string[];
  techniques: string[];
  terrain: string[];
  access: string[];
  maxPrice: number;
  minDays: number;
};

export const emptyFacetState = (): FacetState => ({
  q: '',
  countries: [],
  regions: [],
  species: [],
  speciesMode: 'any',
  tripTypes: [],
  equipment: [],
  techniques: [],
  terrain: [],
  access: [],
  maxPrice: 0,
  minDays: 0,
});

const overlaps = (recordValues: string[], selectedValues: string[]) =>
  selectedValues.length === 0 || selectedValues.some((value) => recordValues.includes(value));

export const matchesFacetState = (
  record: FacetRecord,
  state: FacetState,
  inactiveSources: string[] = [],
  omittedFacet?: CategoricalFacet,
) => {
  if (inactiveSources.includes(record.sourceId)) return false;

  if (!searchCatalogDocument(record.search, state.q).matched) return false;

  if (omittedFacet !== 'destination') {
    const hasDestinationSelection = state.countries.length > 0 || state.regions.length > 0;
    const matchesDestination = record.destinations.some((destination) =>
      state.countries.includes(destination.countryKey) || state.regions.includes(destination.regionKey));
    if (hasDestinationSelection && !matchesDestination) return false;
  }

  if (omittedFacet !== 'species' && state.species.length > 0) {
    const matchesSpecies = state.speciesMode === 'all'
      ? state.species.every((value) => record.species.includes(value))
      : overlaps(record.species, state.species);
    if (!matchesSpecies) return false;
  }

  if (omittedFacet !== 'tripType' && !overlaps([record.tripType], state.tripTypes)) return false;
  if (omittedFacet !== 'equipment' && !overlaps(record.equipment, state.equipment)) return false;
  if (omittedFacet !== 'technique' && !overlaps(record.techniques, state.techniques)) return false;
  if (omittedFacet !== 'terrain' && !overlaps(record.terrain, state.terrain)) return false;
  if (omittedFacet !== 'access' && !overlaps(record.access, state.access)) return false;
  if (state.maxPrice && (record.price === null || record.price > state.maxPrice)) return false;
  if (state.minDays && record.huntingDays < state.minDays) return false;

  return true;
};

export const filterFacetRecords = (
  records: FacetRecord[],
  state: FacetState,
  inactiveSources: string[] = [],
) => records
  .map((record, index) => ({ record, index, match: searchCatalogDocument(record.search, state.q) }))
  .filter(({ record, match }) => match.matched && matchesFacetState(record, { ...state, q: '' }, inactiveSources))
  .sort((left, right) => state.q.trim() ? right.match.score - left.match.score || left.index - right.index : left.index - right.index)
  .map(({ record }) => record);

export const contextualFacetCount = (
  records: FacetRecord[],
  state: FacetState,
  facet: CategoricalFacet,
  value: string,
  inactiveSources: string[] = [],
) => records.filter((record) => {
  if (!matchesFacetState(record, state, inactiveSources, facet)) return false;
  if (facet === 'destination') return record.destinations.some((destination) => destination.countryKey === value || destination.regionKey === value);
  if (facet === 'species') return record.species.includes(value);
  if (facet === 'tripType') return record.tripType === value;
  if (facet === 'equipment') return record.equipment.includes(value);
  if (facet === 'technique') return record.techniques.includes(value);
  if (facet === 'terrain') return record.terrain.includes(value);
  return record.access.includes(value);
}).length;

export const facetStateFromParams = (params: URLSearchParams): FacetState => ({
  q: params.get('q') ?? '',
  countries: params.getAll('country').filter(Boolean),
  regions: params.getAll('region').filter(Boolean),
  species: params.getAll('species').filter(Boolean),
  speciesMode: params.get('speciesMode') === 'all' ? 'all' : 'any',
  tripTypes: params.getAll('tripType').filter(Boolean),
  equipment: params.getAll('equipment').filter(Boolean),
  techniques: params.getAll('technique').filter(Boolean),
  terrain: params.getAll('terrain').filter(Boolean),
  access: params.getAll('access').filter(Boolean),
  maxPrice: Number(params.get('maxPrice') || 0),
  minDays: Number(params.get('minDays') || 0),
});

export const facetStateToParams = (state: FacetState) => {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set('q', state.q.trim());
  for (const value of state.countries) params.append('country', value);
  for (const value of state.regions) params.append('region', value);
  for (const value of state.species) params.append('species', value);
  if (state.species.length > 1 && state.speciesMode === 'all') params.set('speciesMode', 'all');
  for (const value of state.tripTypes) params.append('tripType', value);
  for (const value of state.equipment) params.append('equipment', value);
  for (const value of state.techniques) params.append('technique', value);
  for (const value of state.terrain) params.append('terrain', value);
  for (const value of state.access) params.append('access', value);
  if (state.maxPrice) params.set('maxPrice', String(state.maxPrice));
  if (state.minDays) params.set('minDays', String(state.minDays));
  return params;
};
import { searchCatalogDocument, type CatalogSearchDocument } from './catalog-search.ts';
