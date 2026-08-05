import { readFile } from 'node:fs/promises';

export const registryPath = new URL('../src/data/search-vocabulary.json', import.meta.url);
export const dimensions = ['species', 'destination', 'tripType', 'equipment', 'technique', 'terrain', 'access', 'outfitter'];
export const approvedRelations = ['equivalent', 'translation', 'abbreviation', 'alternate-spelling'];
export const proposalRelations = [...approvedRelations, 'broader', 'narrower', 'related'];
export const confidenceValues = ['high', 'medium', 'low'];

export const normalize = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

export const loadJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
export const loadRegistry = () => loadJson(registryPath);

const requiredString = (issues, value, path) => {
  if (typeof value !== 'string' || !value.trim()) issues.push(`${path} must be a non-empty string`);
};

export function validateRegistry(registry) {
  const issues = [];
  if (registry?.schemaVersion !== '1.0') issues.push('schemaVersion must be 1.0');
  if (!Array.isArray(registry?.entries)) issues.push('entries must be an array');
  if (issues.length) return issues;

  const entryIds = new Set();
  const namesByDimension = new Map();
  for (const [entryIndex, entry] of registry.entries.entries()) {
    const path = `entries.${entryIndex}`;
    if (!dimensions.includes(entry.dimension)) issues.push(`${path}.dimension is not supported`);
    requiredString(issues, entry.key, `${path}.key`);
    requiredString(issues, entry.name, `${path}.name`);
    if (!Array.isArray(entry.aliases)) issues.push(`${path}.aliases must be an array`);
    const entryId = `${entry.dimension}:${entry.key}`;
    if (entryIds.has(entryId)) issues.push(`${path} duplicates ${entryId}`);
    entryIds.add(entryId);
    const names = namesByDimension.get(entry.dimension) ?? new Map();
    const canonicalName = normalize(entry.name);
    if (canonicalName) {
      const existing = names.get(canonicalName);
      if (existing && existing !== entry.key) issues.push(`${path}.name conflicts with ${entry.dimension}:${existing}`);
      names.set(canonicalName, entry.key);
    }
    namesByDimension.set(entry.dimension, names);

    const entryAliases = new Set();
    for (const [aliasIndex, alias] of (entry.aliases ?? []).entries()) {
      const aliasPath = `${path}.aliases.${aliasIndex}`;
      requiredString(issues, alias.value, `${aliasPath}.value`);
      requiredString(issues, alias.locale, `${aliasPath}.locale`);
      requiredString(issues, alias.reviewedBy, `${aliasPath}.reviewedBy`);
      if (!approvedRelations.includes(alias.relation)) issues.push(`${aliasPath}.relation is not approvable`);
      if (alias.status !== 'approved') issues.push(`${aliasPath}.status must be approved`);
      if (!['editorial', 'ai-assisted'].includes(alias.source)) issues.push(`${aliasPath}.source is not supported`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(alias.reviewedAt ?? '')) issues.push(`${aliasPath}.reviewedAt must be YYYY-MM-DD`);
      if (normalize(alias.value) === canonicalName) issues.push(`${aliasPath}.value duplicates the canonical name after normalization`);
      const normalizedAlias = normalize(alias.value);
      if (!normalizedAlias) issues.push(`${aliasPath}.value has no searchable characters`);
      if (entryAliases.has(normalizedAlias)) issues.push(`${aliasPath}.value duplicates another alias for this canonical term`);
      entryAliases.add(normalizedAlias);
      const existing = names.get(normalizedAlias);
      if (existing && existing !== entry.key) issues.push(`${aliasPath}.value conflicts with ${entry.dimension}:${existing}`);
      if (normalizedAlias) names.set(normalizedAlias, entry.key);
    }
  }
  return issues;
}

export function validateProposal(proposal) {
  const issues = [];
  if (proposal?.schemaVersion !== '1.0') issues.push('schemaVersion must be 1.0');
  if (proposal?.promptVersion !== 'taxonomy-aliases-v1') issues.push('promptVersion must be taxonomy-aliases-v1');
  if (!proposal?.canonical || typeof proposal.canonical !== 'object') issues.push('canonical must be an object');
  else {
    if (!dimensions.includes(proposal.canonical.dimension)) issues.push('canonical.dimension is not supported');
    requiredString(issues, proposal.canonical.key, 'canonical.key');
    requiredString(issues, proposal.canonical.name, 'canonical.name');
    requiredString(issues, proposal.canonical.definition, 'canonical.definition');
  }
  if (!Array.isArray(proposal?.candidates)) issues.push('candidates must be an array');
  const candidateValues = new Set();
  for (const [index, candidate] of (proposal?.candidates ?? []).entries()) {
    const path = `candidates.${index}`;
    requiredString(issues, candidate.value, `${path}.value`);
    requiredString(issues, candidate.locale, `${path}.locale`);
    requiredString(issues, candidate.reason, `${path}.reason`);
    if (!proposalRelations.includes(candidate.relation)) issues.push(`${path}.relation is not supported`);
    if (!confidenceValues.includes(candidate.confidence)) issues.push(`${path}.confidence is not supported`);
    const normalizedCandidate = normalize(candidate.value);
    if (candidateValues.has(normalizedCandidate)) issues.push(`${path}.value duplicates another proposal candidate`);
    candidateValues.add(normalizedCandidate);
  }
  if (!Array.isArray(proposal?.rejectedRelatedTerms)) issues.push('rejectedRelatedTerms must be an array');
  return issues;
}

export function registryNameOwners(registry, dimension) {
  const owners = new Map();
  for (const entry of registry.entries.filter((item) => item.dimension === dimension)) {
    owners.set(normalize(entry.name), entry.key);
    for (const alias of entry.aliases) owners.set(normalize(alias.value), entry.key);
  }
  return owners;
}

export function proposalAssessment(proposal, registry) {
  const owners = registryNameOwners(registry, proposal.canonical.dimension);
  return proposal.candidates.map((candidate, index) => {
    const owner = owners.get(normalize(candidate.value));
    const approvable = approvedRelations.includes(candidate.relation);
    return {
      index,
      ...candidate,
      approvable,
      conflict: owner && owner !== proposal.canonical.key ? owner : null,
      alreadyPresent: owner === proposal.canonical.key,
    };
  });
}

export function parseFlags(args) {
  const positional = [];
  const flags = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith('--')) positional.push(value);
    else {
      const key = value.slice(2);
      const next = args[index + 1];
      if (!next || next.startsWith('--')) flags.set(key, [...(flags.get(key) ?? []), true]);
      else {
        flags.set(key, [...(flags.get(key) ?? []), next]);
        index += 1;
      }
    }
  }
  return { positional, flags };
}
