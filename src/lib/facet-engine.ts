export const categoricalFacets = ['destination', 'species', 'tripType', 'method'] as const;

export type CategoricalFacet = (typeof categoricalFacets)[number];
export type SpeciesMode = 'any' | 'all';

export type FacetRecord = {
  id: string;
  sourceId: string;
  search: string;
  country: string;
  region: string;
  species: string[];
  tripType: string;
  methods: string[];
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
  methods: string[];
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
  methods: [],
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

  const query = state.q.trim().toLocaleLowerCase();
  if (query && !record.search.includes(query)) return false;

  if (omittedFacet !== 'destination') {
    const hasDestinationSelection = state.countries.length > 0 || state.regions.length > 0;
    const matchesDestination =
      state.countries.includes(record.country) || state.regions.includes(record.region);
    if (hasDestinationSelection && !matchesDestination) return false;
  }

  if (omittedFacet !== 'species' && state.species.length > 0) {
    const matchesSpecies = state.speciesMode === 'all'
      ? state.species.every((value) => record.species.includes(value))
      : overlaps(record.species, state.species);
    if (!matchesSpecies) return false;
  }

  if (omittedFacet !== 'tripType' && !overlaps([record.tripType], state.tripTypes)) return false;
  if (omittedFacet !== 'method' && !overlaps(record.methods, state.methods)) return false;
  if (state.maxPrice && (record.price === null || record.price > state.maxPrice)) return false;
  if (state.minDays && record.huntingDays < state.minDays) return false;

  return true;
};

export const filterFacetRecords = (
  records: FacetRecord[],
  state: FacetState,
  inactiveSources: string[] = [],
) => records.filter((record) => matchesFacetState(record, state, inactiveSources));

export const contextualFacetCount = (
  records: FacetRecord[],
  state: FacetState,
  facet: CategoricalFacet,
  value: string,
  inactiveSources: string[] = [],
) => records.filter((record) => {
  if (!matchesFacetState(record, state, inactiveSources, facet)) return false;
  if (facet === 'destination') return record.country === value || record.region === value;
  if (facet === 'species') return record.species.includes(value);
  if (facet === 'tripType') return record.tripType === value;
  return record.methods.includes(value);
}).length;

export const facetStateFromParams = (params: URLSearchParams): FacetState => ({
  q: params.get('q') ?? '',
  countries: params.getAll('country').filter(Boolean),
  regions: params.getAll('region').filter(Boolean),
  species: params.getAll('species').filter(Boolean),
  speciesMode: params.get('speciesMode') === 'all' ? 'all' : 'any',
  tripTypes: params.getAll('tripType').filter(Boolean),
  methods: params.getAll('method').filter(Boolean),
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
  for (const value of state.methods) params.append('method', value);
  if (state.maxPrice) params.set('maxPrice', String(state.maxPrice));
  if (state.minDays) params.set('minDays', String(state.minDays));
  return params;
};
