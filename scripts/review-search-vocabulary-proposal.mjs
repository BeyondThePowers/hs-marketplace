import { loadJson, loadRegistry, proposalAssessment, validateProposal, validateRegistry } from './search-vocabulary-core.mjs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: npm run search:vocabulary:review -- <proposal.json>');
  process.exit(2);
}
const [proposal, registry] = await Promise.all([loadJson(path), loadRegistry()]);
const issues = [...validateRegistry(registry), ...validateProposal(proposal)];
if (issues.length) {
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`${proposal.canonical.dimension}:${proposal.canonical.key} ${proposal.canonical.name}`);
console.table(proposalAssessment(proposal, registry).map(({ index, value, relation, locale, confidence, approvable, conflict, alreadyPresent }) => ({
  index, value, relation, locale, confidence,
  review: conflict ? `CONFLICT with ${conflict}` : alreadyPresent ? 'already approved' : approvable ? 'eligible for approval' : 'context only',
})));
console.log('Approve selected eligible indices with:');
console.log(`npm run search:vocabulary:approve -- ${path} --reviewer "Editor name" --accept 0 [--accept 1]`);
