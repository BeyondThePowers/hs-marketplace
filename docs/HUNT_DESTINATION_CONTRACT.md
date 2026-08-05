# Hunt destination contract

## Decision

A hunt has one or more destinations. Each destination is an explicit country
and region pair with stable keys and display names. A multi-region hunt stores
two destination records, never a combined region string.

```json
{
  "location": {
    "destinations": [
      {
        "country": { "key": "argentina", "name": "Argentina" },
        "region": { "key": "cordoba", "name": "Córdoba" },
        "privacyMode": "approximate"
      },
      {
        "country": { "key": "argentina", "name": "Argentina" },
        "region": { "key": "santa-fe", "name": "Santa Fe" },
        "privacyMode": "approximate"
      }
    ]
  }
}
```

## Responsibilities

- Marketing-site content is the authority for a hunt's destination pairs.
- Feed validation rejects missing and duplicate destination pairs.
- Marketplace ingestion stores one normalized row per pair.
- Facets use stable keys and count a multi-region hunt in every applicable
  country and region.
- Human-readable page labels are derived from the same array. They are
  presentation, never identifiers and never parsed back into data.
- A destination page includes a hunt when any destination pair matches it.

No layer splits strings on commas, ampersands, or the word "and". The scalar
`country`, scalar `region`, and duplicate free-form `location` fields have been
removed from the hunt contract and marketplace table.

## Marketing-site presentation

The data change does not impose one visual treatment. A branded site can show
all regions in a compact label, show each as a link, or emphasize a primary
region. Filtering and related-content queries must test membership in the
destination array. The first item is presentation order, not a hidden fallback
for a single-region data model.

## Lodge distinction

A lodge remains a physical accommodation with its own singular location. Hunt
destinations describe where the hunting package operates. A hunt can therefore
span several regions while referencing one or more accommodations without
conflating the two concepts.
