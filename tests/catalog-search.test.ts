import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCatalogSearchDocument,
  normalizeSearchText,
  searchCatalogDocument,
} from '../src/lib/catalog-search.ts';
import { filterFacetRecords, type FacetRecord, type FacetState } from '../src/lib/facet-engine.ts';

const document = createCatalogSearchDocument({
  title: ['La Pampa Red Stag Adventure'],
  outfitter: ['JJ Cacería'],
  taxonomy: [
    { dimension: 'species', key: 'red-stag', name: 'Red Stag' },
    { dimension: 'destination', key: 'la-pampa', name: 'La Pampa' },
  ],
  summary: ['A guided deer hunt across open country.'],
  details: ['Private lodge', 'Airport transfer from Santa Rosa'],
});

test('normalizes accents, punctuation, and whitespace', () => {
  assert.equal(normalizeSearchText('  JJ Cacería: Córdoba  '), 'jj caceria cordoba');
});

test('matches meaningful query terms independently with AND semantics', () => {
  assert.equal(searchCatalogDocument(document, 'stag pampa').matched, true);
  assert.equal(searchCatalogDocument(document, 'stag cordoba').matched, false);
});

test('matches approved semantic aliases from the governed vocabulary', () => {
  assert.equal(searchCatalogDocument(document, 'red deer').matched, true);
});

test('uses conservative fuzzy matching for transpositions in controlled fields', () => {
  const result = searchCatalogDocument(document, 'pmapa');
  assert.equal(result.matched, true);
  assert.deepEqual(result.fuzzyCorrections, [{ query: 'pmapa', candidate: 'pampa' }]);
});

test('does not fuzzily reinterpret short terms or long descriptive prose', () => {
  assert.equal(searchCatalogDocument(document, 'bow').matched, false);
  assert.equal(searchCatalogDocument(document, 'airprot').matched, false);
});

test('ranks title matches above summary matches while preserving faceting', () => {
  const summaryDocument = createCatalogSearchDocument({
    title: ['Open Country Expedition'],
    outfitter: [],
    taxonomy: [],
    summary: ['A red stag opportunity.'],
    details: [],
  });
  const makeRecord = (id: string, search: typeof document): FacetRecord => ({
    id,
    sourceId: 'source',
    search,
    destinations: [{ countryKey: 'argentina', regionKey: 'argentina:la-pampa' }],
    species: ['Red Stag'],
    tripType: 'BigGame',
    equipment: ['Rifle'],
    techniques: [],
    terrain: [],
    access: [],
    price: 5000,
    huntingDays: 5,
  });
  const state: FacetState = {
    q: 'red stag', countries: [], regions: [], species: ['Red Stag'], speciesMode: 'any', tripTypes: [],
    equipment: [], techniques: [], terrain: [], access: [], maxPrice: 0, minDays: 0,
  };
  assert.deepEqual(
    filterFacetRecords([makeRecord('summary', summaryDocument), makeRecord('title', document)], state).map(({ id }) => id),
    ['title', 'summary'],
  );
});
