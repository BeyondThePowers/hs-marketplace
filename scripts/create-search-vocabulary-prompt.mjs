import { dimensions, loadRegistry, parseFlags } from './search-vocabulary-core.mjs';

const { positional, flags } = parseFlags(process.argv.slice(2));
const [dimension, key, name] = positional;
const definition = flags.get('definition')?.at(-1);
const locale = flags.get('locale')?.at(-1) ?? 'en';
if (!dimensions.includes(dimension) || !key || !name || typeof definition !== 'string') {
  console.error('Usage: npm run search:vocabulary:prompt -- <dimension> <key> <name> --definition <definition> [--locale <locale>]');
  process.exit(2);
}

const registry = await loadRegistry();
const existingVocabulary = registry.entries
  .filter((entry) => entry.dimension === dimension)
  .map(({ key: existingKey, name: existingName, aliases }) => ({
    key: existingKey,
    name: existingName,
    aliases: aliases.map((alias) => alias.value),
  }));

const prompt = {
  role: 'You assist with a governed hunting-marketplace search taxonomy.',
  promptVersion: 'taxonomy-aliases-v1',
  instructions: [
    'Generate only terms a hunter might reasonably use to refer to the same entity as the canonical term.',
    'Classify every candidate as equivalent, translation, abbreviation, alternate-spelling, broader, narrower, or related.',
    'Never classify a broader, narrower, or related term as an alias.',
    'Do not generate typographical errors, SEO keywords, promotional language, or speculative associations.',
    'Respect biological, geographic, and hunting-domain distinctions in the definition.',
    'Check the existing vocabulary and report ambiguous or conflicting mappings.',
    'Return JSON only. Do not wrap the response in Markdown.',
  ],
  canonical: { dimension, key, name, definition, primaryLocale: locale },
  existingVocabulary,
  outputShape: {
    schemaVersion: '1.0',
    promptVersion: 'taxonomy-aliases-v1',
    canonical: { dimension, key, name, definition },
    candidates: [{ value: 'string', relation: 'equivalent | translation | abbreviation | alternate-spelling | broader | narrower | related', locale: 'BCP 47 language tag', confidence: 'high | medium | low', reason: 'short factual reason' }],
    rejectedRelatedTerms: [{ value: 'string', relation: 'broader | narrower | related', reason: 'why it is not an alias' }],
  },
};

console.log(JSON.stringify(prompt, null, 2));
