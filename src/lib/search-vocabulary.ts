import vocabularyData from '../data/search-vocabulary.json' with { type: 'json' };

export const searchDimensions = [
  'species',
  'destination',
  'tripType',
  'equipment',
  'technique',
  'terrain',
  'access',
  'outfitter',
] as const;

export type SearchDimension = (typeof searchDimensions)[number];
export type SearchAliasRelation = 'equivalent' | 'translation' | 'abbreviation' | 'alternate-spelling';

export type ApprovedSearchAlias = {
  value: string;
  locale: string;
  relation: SearchAliasRelation;
  status: 'approved';
  source: 'editorial' | 'ai-assisted';
  reviewedBy: string;
  reviewedAt: string;
  promptVersion?: string;
};

export type SearchVocabularyEntry = {
  dimension: SearchDimension;
  key: string;
  name: string;
  aliases: ApprovedSearchAlias[];
};

const entries = vocabularyData.entries as SearchVocabularyEntry[];
const vocabulary = new Map(entries.map((entry) => [`${entry.dimension}:${entry.key}`, entry]));

export const vocabularyAliases = (dimension: SearchDimension, key: string) =>
  vocabulary.get(`${dimension}:${key}`)?.aliases.map((alias) => alias.value) ?? [];

export const searchVocabularyEntries = () => entries;
