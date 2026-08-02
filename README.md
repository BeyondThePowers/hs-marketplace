# Marketplace

Astro + Netlify public hunt marketplace.

This app consumes synced marketplace data from its own marketplace database. It should not fetch source outfitter feeds during normal public page rendering.

Architecture note:

```text
../MARKETPLACE_SYNC_PLAN.md
../MARKETPLACE_PUBLISHING_ARCHITECTURE.md
```

The marketplace feed contract is implemented in
`src/lib/marketplace-content-schema.ts`. Version 1 includes both a public
outfitter profile and hunt records with stable listing IDs. Marketing feeds may
contain draft records, but draft records are never eligible for public
publication.

The outfitter portal is not part of marketplace ingestion. Scheduled
reconciliation is the universal synchronization mechanism and refetches each
active registered public marketing feed. Authenticated deploy webhooks are an
optional faster notification path. Operational status is available at the
protected `/admin/source-health` route.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run dev:netlify
npm run source:credential
npm run source:status -- <source-id> <status> <operator> [reason]
npm run source:moderate -- <source-id> <status> <operator> [reason]
npm run source:sync -- <source-id>
npm run feed:validate -- <feed-file> [<feed-file> ...]
npm run controls:verify
```

`source:sync` is an operational and development command that runs the same
ingestion service used by webhooks and scheduled reconciliation. It reads the
marketplace server credentials from the ignored `.env` file. Local HTTP feeds
also require `ALLOW_INSECURE_SOURCE_URLS=1`; never configure that override in a
deployed environment.

Participation states are `pending`, `active`, `paused`, and `withdrawn`.
Activating a source records the supplied operator identity as the consent
record. Pausing or withdrawing a source immediately removes it from the
database-enforced public eligibility layer without deleting synchronized
history.

Moderation states are `pending_review`, `approved`, `rejected`, and
`suspended`. The service-only `source:moderate` command applies one status to a
source's outfitter and hunts and records the operator, time, and reason. A
development approval is not a substitute for final outfitter fact review.
