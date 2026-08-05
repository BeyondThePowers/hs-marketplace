import type { SearchDimension } from './search-vocabulary.ts';
import { vocabularyAliases } from './search-vocabulary.ts';

export const searchFields = [
  'title',
  'outfitter',
  'taxonomy',
  'summary',
  'details',
] as const;

export type SearchField = (typeof searchFields)[number];
export type SearchFieldIndex = { text: string; tokens: string[] };
export type CatalogSearchDocument = Record<SearchField, SearchFieldIndex>;

export type SearchVocabularyTerm = {
  dimension: SearchDimension;
  key: string;
  name: string;
};

export type SearchDocumentInput = {
  title: string[];
  outfitter: string[];
  taxonomy: SearchVocabularyTerm[];
  summary: string[];
  details: string[];
};

export type CatalogSearchMatch = {
  matched: boolean;
  score: number;
  fuzzyCorrections: Array<{ query: string; candidate: string }>;
};

const stopWords = new Set(['a', 'an', 'and', 'for', 'hunt', 'hunting', 'in', 'of', 'on', 'or', 'package', 'the', 'to', 'trip', 'with']);
const fuzzyFields = new Set<SearchField>(['title', 'outfitter', 'taxonomy']);
const fieldWeights: Record<SearchField, number> = {
  title: 100,
  outfitter: 90,
  taxonomy: 80,
  summary: 40,
  details: 25,
};

export const normalizeSearchText = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const tokenize = (value: string, removeStopWords = false) => {
  const tokens = normalizeSearchText(value).split(' ').filter(Boolean);
  const meaningful = removeStopWords ? tokens.filter((token) => !stopWords.has(token)) : tokens;
  return [...new Set(meaningful.length > 0 ? meaningful : tokens)];
};

const indexValues = (values: string[]): SearchFieldIndex => {
  const normalized = [...new Set(values.map(normalizeSearchText).filter(Boolean))];
  return {
    text: normalized.join(' | '),
    tokens: [...new Set(normalized.flatMap((value) => tokenize(value)))],
  };
};

export const createCatalogSearchDocument = (input: SearchDocumentInput): CatalogSearchDocument => {
  const taxonomyValues = input.taxonomy.flatMap((term) => [
    term.name,
    ...vocabularyAliases(term.dimension, term.key),
  ]);
  return {
    title: indexValues(input.title),
    outfitter: indexValues(input.outfitter),
    taxonomy: indexValues(taxonomyValues),
    summary: indexValues(input.summary),
    details: indexValues(input.details),
  };
};

const damerauLevenshteinWithin = (left: string, right: string, limit: number) => {
  if (Math.abs(left.length - right.length) > limit) return false;
  const previousPrevious = new Array(right.length + 1).fill(0);
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + Number(left[leftIndex - 1] !== right[rightIndex - 1]);
      const insertion = current[rightIndex - 1] + 1;
      const deletion = previous[rightIndex] + 1;
      let distance = Math.min(substitution, insertion, deletion);
      if (
        leftIndex > 1 && rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        distance = Math.min(distance, previousPrevious[rightIndex - 2] + 1);
      }
      current[rightIndex] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }
    if (rowMinimum > limit) return false;
    previousPrevious.splice(0, previousPrevious.length, ...previous);
    previous = current;
  }
  return previous[right.length] <= limit;
};

const fuzzyLimit = (queryToken: string, candidate: string) => {
  const longest = Math.max(queryToken.length, candidate.length);
  if (Math.min(queryToken.length, candidate.length) < 4) return 0;
  return longest >= 9 ? 2 : 1;
};

export const searchCatalogDocument = (document: CatalogSearchDocument, rawQuery: string): CatalogSearchMatch => {
  const normalizedQuery = normalizeSearchText(rawQuery);
  const queryTokens = tokenize(normalizedQuery, true);
  if (!normalizedQuery || queryTokens.length === 0) return { matched: true, score: 0, fuzzyCorrections: [] };

  let score = 0;
  const fuzzyCorrections: Array<{ query: string; candidate: string }> = [];
  for (const queryToken of queryTokens) {
    let best = 0;
    for (const field of searchFields) {
      const weight = fieldWeights[field];
      const tokens = document[field].tokens;
      if (tokens.includes(queryToken)) best = Math.max(best, weight);
      else if (queryToken.length >= 3 && tokens.some((token) => token.startsWith(queryToken))) best = Math.max(best, weight * 0.72);
    }
    if (best === 0) {
      let correction = '';
      for (const field of searchFields) {
        if (!fuzzyFields.has(field)) continue;
        const weight = fieldWeights[field];
        const fuzzyMatch = document[field].tokens.find((candidate) => {
          const limit = fuzzyLimit(queryToken, candidate);
          return limit > 0 && damerauLevenshteinWithin(queryToken, candidate, limit);
        });
        if (fuzzyMatch && weight * 0.32 > best) {
          best = weight * 0.32;
          correction = fuzzyMatch;
        }
      }
      if (best > 0) fuzzyCorrections.push({ query: queryToken, candidate: correction });
    }
    if (best === 0) return { matched: false, score: 0, fuzzyCorrections: [] };
    score += best;
  }

  for (const field of searchFields) {
    if (document[field].text.includes(normalizedQuery)) score += fieldWeights[field] * 0.6;
  }
  return { matched: true, score, fuzzyCorrections };
};
