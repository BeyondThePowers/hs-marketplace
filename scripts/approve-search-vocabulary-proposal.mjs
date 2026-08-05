import { mkdir, writeFile } from 'node:fs/promises';
import {
  loadJson,
  loadRegistry,
  parseFlags,
  proposalAssessment,
  registryPath,
  validateProposal,
  validateRegistry,
} from './search-vocabulary-core.mjs';

const { positional, flags } = parseFlags(process.argv.slice(2));
const path = positional[0];
const reviewer = flags.get('reviewer')?.at(-1);
const acceptedIndices = (flags.get('accept') ?? []).map(Number);
if (!path || typeof reviewer !== 'string' || !reviewer.trim() || acceptedIndices.length === 0 || acceptedIndices.some(Number.isNaN)) {
  console.error('Usage: npm run search:vocabulary:approve -- <proposal.json> --reviewer <name> --accept <index> [--accept <index>]');
  process.exit(2);
}

const [proposal, registry] = await Promise.all([loadJson(path), loadRegistry()]);
const issues = [...validateRegistry(registry), ...validateProposal(proposal)];
if (issues.length) {
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}
const assessment = proposalAssessment(proposal, registry);
const selected = [...new Set(acceptedIndices)].map((index) => assessment[index]);
if (selected.some((candidate) => !candidate)) throw new Error('An accepted candidate index does not exist');
for (const candidate of selected) {
  if (!candidate.approvable) throw new Error(`Candidate ${candidate.index} is ${candidate.relation} and cannot be approved as an alias`);
  if (candidate.conflict) throw new Error(`Candidate ${candidate.index} conflicts with ${candidate.conflict}`);
}

let entry = registry.entries.find((item) => item.dimension === proposal.canonical.dimension && item.key === proposal.canonical.key);
if (!entry) {
  entry = { dimension: proposal.canonical.dimension, key: proposal.canonical.key, name: proposal.canonical.name, aliases: [] };
  registry.entries.push(entry);
} else if (entry.name !== proposal.canonical.name) {
  throw new Error(`Canonical name differs from the registry: ${entry.name}`);
}

const reviewedAt = new Date().toISOString().slice(0, 10);
let additions = 0;
for (const candidate of selected) {
  if (candidate.alreadyPresent) continue;
  entry.aliases.push({
    value: candidate.value,
    locale: candidate.locale,
    relation: candidate.relation,
    status: 'approved',
    source: 'ai-assisted',
    reviewedBy: reviewer.trim(),
    reviewedAt,
    promptVersion: proposal.promptVersion,
  });
  additions += 1;
}
entry.aliases.sort((left, right) => left.value.localeCompare(right.value));
registry.entries.sort((left, right) => left.dimension.localeCompare(right.dimension) || left.name.localeCompare(right.name));
const finalIssues = validateRegistry(registry);
if (finalIssues.length) throw new Error(`Approval would make the registry invalid:\n${finalIssues.join('\n')}`);
await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
if (additions > 0) {
  const archiveDirectory = new URL('../docs/search-vocabulary-approvals/', import.meta.url);
  await mkdir(archiveDirectory, { recursive: true });
  const timestamp = new Date().toISOString();
  const archiveName = `${timestamp.replace(/[:.]/g, '-')}-${entry.dimension}-${entry.key}.json`;
  await writeFile(new URL(archiveName, archiveDirectory), `${JSON.stringify({
    approvedAt: timestamp,
    reviewedBy: reviewer.trim(),
    acceptedIndices: selected.filter((candidate) => !candidate.alreadyPresent).map((candidate) => candidate.index),
    proposal,
  }, null, 2)}\n`, 'utf8');
}
console.log(`Approved ${additions} new aliases for ${entry.dimension}:${entry.key}.`);
