import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contextualFacetCount,
  facetStateFromParams,
  facetStateToParams,
  filterFacetRecords,
  type FacetRecord,
  type FacetState,
} from '../src/lib/facet-engine.ts';
import { speciesTaxonomyFor } from '../src/data/species-taxonomy.ts';

const records: FacetRecord[] = [
  { id: 'duck', sourceId: 'a', search: 'duck dove argentina', country: 'Argentina', region: 'Santa Fe', species: ['Duck', 'Dove'], tripType: 'Combo', equipment: ['Shotgun'], techniques: ['Blind hunting', 'Decoying'], terrain: ['Wetlands'], access: ['Boat'], price: 3000, huntingDays: 5 },
  { id: 'dove', sourceId: 'a', search: 'dove argentina', country: 'Argentina', region: 'Córdoba', species: ['Dove'], tripType: 'Wingshooting', equipment: ['Shotgun'], techniques: ['Pass shooting'], terrain: ['Agricultural fields'], access: ['4x4 vehicle'], price: 1800, huntingDays: 4 },
  { id: 'elk', sourceId: 'b', search: 'elk united states', country: 'United States', region: 'Montana', species: ['Elk'], tripType: 'BigGame', equipment: ['Rifle', 'Bow'], techniques: ['Spot and stalk'], terrain: ['Alpine'], access: ['On foot'], price: 7000, huntingDays: 6 },
];

const state = (overrides: Partial<FacetState> = {}): FacetState => ({
  q: '', countries: [], regions: [], species: [], speciesMode: 'any', tripTypes: [], equipment: [], techniques: [], terrain: [], access: [], maxPrice: 0, minDays: 0, ...overrides,
});

test('uses OR within a categorical facet and AND across different facets', () => {
  assert.deepEqual(
    filterFacetRecords(records, state({ species: ['Duck', 'Elk'], equipment: ['Shotgun'] })).map(({ id }) => id),
    ['duck'],
  );
});

test('supports an explicit every-selected-species mode for combination hunts', () => {
  assert.deepEqual(
    filterFacetRecords(records, state({ species: ['Duck', 'Dove'], speciesMode: 'all' })).map(({ id }) => id),
    ['duck'],
  );
});

test('treats country and region choices as one hierarchical destination facet', () => {
  assert.deepEqual(
    filterFacetRecords(records, state({ countries: ['United States'], regions: ['Córdoba'] })).map(({ id }) => id),
    ['dove', 'elk'],
  );
});

test('calculates disjunctive counts using every other active constraint', () => {
  const selected = state({ species: ['Dove'], equipment: ['Shotgun'] });
  assert.equal(contextualFacetCount(records, selected, 'species', 'Duck'), 1);
  assert.equal(contextualFacetCount(records, selected, 'species', 'Elk'), 0);
  assert.equal(contextualFacetCount(records, selected, 'equipment', 'Bow'), 0);
  assert.equal(contextualFacetCount(records, selected, 'terrain', 'Wetlands'), 1);
});

test('round trips repeated shareable parameters', () => {
  const selected = state({ species: ['Duck', 'Dove'], speciesMode: 'all', equipment: ['Shotgun', 'Bow'], techniques: ['Blind hunting'], maxPrice: 5000 });
  const params = facetStateToParams(selected);
  assert.deepEqual(params.getAll('species'), ['Duck', 'Dove']);
  assert.deepEqual(params.getAll('equipment'), ['Shotgun', 'Bow']);
  assert.deepEqual(params.getAll('technique'), ['Blind hunting']);
  assert.deepEqual(facetStateFromParams(params), selected);
});

test('excludes inactive sources before calculating results', () => {
  assert.deepEqual(filterFacetRecords(records, state(), ['a']).map(({ id }) => id), ['elk']);
});

test('groups known species without inferring taxonomy from hunt prose', () => {
  assert.deepEqual(speciesTaxonomyFor('Cinnamon Teal'), {
    pursuitGroup: { key: 'game-birds', name: 'Game birds' },
    speciesGroup: { key: 'waterfowl', name: 'Waterfowl' },
  });
  assert.deepEqual(speciesTaxonomyFor('Unclassified Quarry'), {
    pursuitGroup: { key: 'other-species', name: 'Other species' },
  });
});

test('prefers taxonomy published by the source feed', () => {
  const published = {
    pursuitGroup: { key: 'small-game', name: 'Small game' },
    speciesGroup: { key: 'rabbit-and-hare', name: 'Rabbit and hare' },
  };
  assert.deepEqual(speciesTaxonomyFor('Snowshoe Hare', published), published);
});
