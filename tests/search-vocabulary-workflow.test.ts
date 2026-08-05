import assert from 'node:assert/strict';
import test from 'node:test';
import vocabulary from '../src/data/search-vocabulary.json' with { type: 'json' };
import proposal from './fixtures/search-vocabulary-proposal.json' with { type: 'json' };
import {
  proposalAssessment,
  validateProposal,
  validateRegistry,
} from '../scripts/search-vocabulary-core.mjs';

test('validates the committed vocabulary and structured AI proposal', () => {
  assert.deepEqual(validateRegistry(vocabulary), []);
  assert.deepEqual(validateProposal(proposal), []);
});

test('distinguishes approvable aliases from broader contextual terms', () => {
  const assessment = proposalAssessment(proposal, vocabulary);
  assert.equal(assessment[0].approvable, true);
  assert.equal(assessment[0].alreadyPresent, true);
  assert.equal(assessment[1].approvable, false);
});

test('rejects aliases that collide with another canonical term', () => {
  const invalid = structuredClone(vocabulary);
  invalid.entries.push({
    dimension: 'species',
    key: 'example-species',
    name: 'Example Species',
    aliases: [{
      value: 'red deer', locale: 'en', relation: 'equivalent', status: 'approved', source: 'editorial',
      reviewedBy: 'Test editor', reviewedAt: '2026-08-05',
    }],
  });
  assert.ok(validateRegistry(invalid).some((issue) => issue.includes('conflicts with species:red-stag')));
});
