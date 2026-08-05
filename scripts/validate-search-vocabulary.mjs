import { loadJson, loadRegistry, validateProposal, validateRegistry } from './search-vocabulary-core.mjs';

const registry = await loadRegistry();
const registryIssues = validateRegistry(registry);
if (registryIssues.length) {
  console.error('Search vocabulary is invalid:');
  for (const issue of registryIssues) console.error(`- ${issue}`);
  process.exit(1);
}
console.log(`Search vocabulary is valid: ${registry.entries.length} entries, ${registry.entries.flatMap((entry) => entry.aliases).length} approved aliases.`);

for (const path of process.argv.slice(2)) {
  const proposal = await loadJson(path);
  const issues = validateProposal(proposal);
  if (issues.length) {
    console.error(`${path} is invalid:`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else console.log(`${path} is a valid alias proposal with ${proposal.candidates.length} candidates.`);
}
