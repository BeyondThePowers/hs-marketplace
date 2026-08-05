# Search vocabulary editor guide

## Purpose

The marketplace search vocabulary lets hunters find a canonical term using an
equivalent name, translation, abbreviation, or established alternate spelling.
AI can propose candidates, but only an editor can approve them.

Aliases are maintained once per canonical taxonomy term. They are not entered
on individual hunts and do not change the visible hunt content or facet labels.
Typographical errors are handled by conservative fuzzy matching and must not be
stored as aliases.

## What the search system already handles

Do not create aliases for differences that deterministic normalization handles:

- uppercase and lowercase;
- accents, such as `Córdoba` and `Cordoba`;
- punctuation and hyphens;
- repeated whitespace;
- a likely one-character typo or transposition in a sufficiently long title,
  outfitter name, or controlled vocabulary term.

The browser shows a notice when fuzzy spelling matches are included. Fuzzy
matching is deliberately not applied to long summaries or package details.

## What may be approved

An alias must refer to the same entity or concept as the canonical term:

- `equivalent`: another established name for the same concept;
- `translation`: an equivalent name in a specified language or locale;
- `abbreviation`: an established abbreviation such as `4WD`;
- `alternate-spelling`: an established conventional spelling, not a typo.

Never approve:

- `broader`: a parent category, such as Deer for Red Stag;
- `narrower`: a more specific subtype;
- `related`: an associated activity, place, animal, or marketing phrase;
- generated misspellings;
- promotional keywords or phrases intended only to attract traffic;
- a term whose meaning is uncertain or changes by region without adequate
  qualification.

## Files and commands

The approved registry is:

```text
src/data/search-vocabulary.json
```

Approval records are written to:

```text
docs/search-vocabulary-approvals/
```

Available commands:

```sh
npm run search:vocabulary:prompt
npm run search:vocabulary:review
npm run search:vocabulary:approve
npm run search:vocabulary:validate
npm test
```

Run commands from the `marketplace` directory.

## Complete editorial workflow

### 1. Confirm the canonical term

Identify its dimension, stable key, display name, definition, and primary
locale. Supported dimensions are:

- `species`
- `destination`
- `tripType`
- `equipment`
- `technique`
- `terrain`
- `access`
- `outfitter`

The definition must be specific enough to distinguish the term from nearby
concepts. Species definitions should identify the animal accurately.
Destination definitions should identify the actual jurisdiction or geographic
entity. Techniques and equipment should explain how the term is used in a hunt.

### 2. Generate the AI prompt

Quote arguments containing spaces:

```sh
npm run search:vocabulary:prompt -- \
  species red-stag "Red Stag" \
  --definition "Cervus elaphus in the marketplace species taxonomy" \
  --locale en
```

The command prints a structured prompt containing the governance rules,
canonical definition, existing vocabulary, and required JSON response shape.
Copy the complete output into the approved AI tool.

Do not shorten the prompt by removing the existing vocabulary or relationship
rules. Those sections help prevent collisions and overly broad suggestions.

### 3. Save the AI response

The response must be JSON only. Save it as a working proposal, for example:

```text
/tmp/red-stag-alias-proposal.json
```

Do not copy Markdown fences around the JSON.

### 4. Validate and inspect the proposal

```sh
npm run search:vocabulary:validate -- /tmp/red-stag-alias-proposal.json
npm run search:vocabulary:review -- /tmp/red-stag-alias-proposal.json
```

The review table assigns each candidate an index and reports whether it is:

- eligible for approval;
- contextual only because it is broader, narrower, or related;
- already approved;
- conflicting with another canonical term.

Automated validation checks structure and deterministic conflicts. It cannot
prove that two biological, geographic, or hunting terms mean the same thing.
The editor remains responsible for semantic accuracy.

### 5. Review each eligible candidate

For every candidate, ask:

1. Does it mean the same thing as the canonical term?
2. Is it used by real hunters or outfitters in the stated locale?
3. Could it also refer to another marketplace term?
4. Is it a genuine name rather than a broader group or related phrase?
5. Would selecting the canonical facet still accurately describe every result
   found through this alias?

Reject the candidate if any answer is uncertain. It can be reconsidered later
with better evidence.

### 6. Approve selected indices

Specify the editor's real name and repeat `--accept` for every approved index:

```sh
npm run search:vocabulary:approve -- \
  /tmp/red-stag-alias-proposal.json \
  --reviewer "Editor name" \
  --accept 0 \
  --accept 2
```

The command refuses broader, narrower, related, or conflicting terms. It adds
approved aliases to the registry with the editor, date, AI-assisted provenance,
and prompt version. It also creates an approval record containing the complete
proposal and accepted indices.

### 7. Validate and test

```sh
npm run search:vocabulary:validate
npm test
npm run build
```

Then test representative searches in the catalogue:

- the canonical term;
- every newly approved alias;
- a query combining the alias with a destination or outfitter;
- a nearby term that should not match;
- the applicable exact facet.

Confirm that relevant results appear, irrelevant results do not appear, facet
counts remain correct, and title or outfitter matches rank above descriptive
mentions.

### 8. Commit the review trail

Commit together:

- `src/data/search-vocabulary.json`;
- the new file in `docs/search-vocabulary-approvals/`;
- any new regression test required for an important or ambiguous term.

## Handling ambiguous terms

One alias cannot map to two canonical terms in the same dimension. If a term is
ambiguous:

- do not approve it as an alias;
- retain it as a normal keyword if it appears in visible content;
- consider a qualified phrase such as a regional or species-specific name;
- add an autocomplete disambiguation feature before attempting to map it.

The same word may exist in different dimensions when the meanings are clear.
For example, a destination and an outfitter could theoretically share a name,
because search can evaluate those fields independently.

## Using unsuccessful searches

When anonymized no-result reporting is available, review frequently repeated
queries rather than sending every query to AI. Classify each term first:

- likely typo: rely on fuzzy matching or adjust its conservative threshold;
- real synonym or translation: run the proposal workflow;
- broader browsing request: consider a parent facet or autocomplete option;
- missing catalogue content: do not create an alias;
- unrelated query: take no action.

Never store personal information or complete user sessions in the vocabulary
workflow.

## Correcting or removing an alias

Edit the approved registry to remove the alias and create a new correction
record explaining the change. Do not alter the original approval record. Then
run:

```sh
npm run search:vocabulary:validate
npm test
npm run build
```

Verify that the removed alias no longer finds the canonical term unless it
appears legitimately in indexed public content. Commit the correction and its
explanation together.

## Editor checklist

- [ ] Canonical key, name, dimension, definition, and locale are correct.
- [ ] The complete generated prompt was used.
- [ ] The JSON proposal validates.
- [ ] Every accepted term is truly equivalent, translated, abbreviated, or an
      established alternate spelling.
- [ ] No typo, broader category, related phrase, or promotional keyword was
      approved.
- [ ] Collision warnings were resolved rather than bypassed.
- [ ] The approving editor is recorded by name.
- [ ] Registry validation, search tests, and the marketplace build pass.
- [ ] The approval record and vocabulary change are committed together.
