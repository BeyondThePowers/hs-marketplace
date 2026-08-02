# Marketplace deployment

Database setup is migration-driven. Source content comes only from registered
marketing-site feeds.

## Local database

```bash
npm run db:start
npm run db:reset
npm run db:types
```

`db:reset` applies the committed migrations and registers the development JJ
and ABH sources in a disabled state. Local Supabase requires Docker.

## Remote Supabase

Create a dedicated marketplace project, then link and push migrations:

```bash
npm run db:link -- --project-ref <project-ref>
npm run db:push
```

Do not place marketplace tables in an outfitter database. Avoid manual SQL in
the dashboard except for documented recovery work.

## Netlify environment

```text
PUBLIC_SITE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MARKETPLACE_DIAGNOSTICS_USER
MARKETPLACE_DIAGNOSTICS_PASSWORD
```

`SUPABASE_SERVICE_ROLE_KEY` and diagnostics credentials are server-only.
`ALLOW_INSECURE_SOURCE_URLS=1` is permitted only for explicit local testing and
must never be enabled in Netlify.

Netlify builds with `npm run build` and publishes `dist`.

The public build uses the anonymous key to call the read-only
`marketplace_get_public_catalog()` function. That function returns hunts,
outfitters, lodges, relationships, and media from one database statement. The
build memoizes that result and generates every public route from the same
snapshot. Public visitors do not query Supabase.

## Source registration

Register one row per marketing deployment in `marketplace_sources`. A source
starts with `participation_status = 'pending'`. Its `content_feed_url` must be
the exact HTTPS URL the feed declares in `source.feedUrl`.

After confirming the outfitter's participation and validating the deployed
feed, activate it with:

```bash
npm run source:status -- <source-id> active <operator> "Participation confirmed"
```

Use `paused` for a reversible marketplace-side suspension and `withdrawn` when
the outfitter ends participation. These transitions immediately remove the
source from public eligibility while retaining its synchronized history.

Scheduled reconciliation is the baseline for every active source. A marketing
site does not require marketplace credentials to participate.

## Optional deploy webhooks

Deploy webhooks reduce the delay between a marketing deployment and the next
scheduled reconciliation. They are optional.

Generate a unique webhook credential:

```bash
npm run source:credential
```

The command prints the plaintext secret once, its SHA-256 hash, and a short
hint. Store only the hash and hint in `marketplace_sources`. Put the plaintext
secret only in the source marketing site's Netlify environment:

```text
MARKETPLACE_SYNC_URL=https://<marketplace-domain>/api/sync/source
MARKETPLACE_SOURCE_ID=<source UUID>
MARKETPLACE_WEBHOOK_SECRET=<plaintext secret>
```

After the feed validates, configure its credential hash if immediate deploy
notifications are desired. Never reuse a webhook secret between outfitters.

## Synchronization

`POST /api/sync/source` is the source-triggered fast path. It requires both:

```text
Authorization: Bearer <per-source secret>
X-Marketplace-Source-Id: <source UUID>
```

Missing, unknown, disabled, unconfigured, or invalid credentials are rejected.
The request contains no listing payload. The marketplace always refetches the
registered public feed.

`scheduled-sync` is an hourly Netlify Scheduled Function. Netlify does not
expose scheduled functions as public URLs. It invokes the same ingestion logic
for every source whose participation status is `active`, regardless of webhook
configuration.

## Public eligibility

Database row-level policies, the `marketplace_public_*` views, and the
`marketplace_get_public_catalog()` snapshot function are the authoritative
public boundary. A hunt is eligible only when:

- marketplace participation is `active`;
- the most recently accepted feed reports `source.enabled = true`;
- the hunt is active, ready, approved, and not orphaned; and
- the outfitter is centrally approved.

Public pages must query these views rather than the internal synchronization
tables.

## Diagnostics

`/admin/source-health` is protected with HTTP Basic authentication and fails
closed when its credentials are absent. It displays registration, webhook,
feed, synchronization, failure, listing, publication, and orphan status without
displaying credential hashes or secrets.

## Promotion checklist

1. Apply migrations to a dedicated marketplace staging project.
2. Configure marketplace server and diagnostics credentials.
3. Deploy and validate each participating marketing feed.
4. Record participation consent and activate one source at a time.
5. Run reconciliation twice and confirm idempotency.
6. Optionally configure separate deploy webhook credentials.
7. Approve central moderation only after source facts are ready.
8. Verify anonymous access through the three public views before deploying
   catalog or detail pages.

Use the audited moderation command rather than editing moderation columns
directly:

```bash
npm run source:moderate -- <source-id> approved <operator> <reason>
```

The command records the operator, timestamp, and reason on both the outfitter
and hunt records. Use `pending_review`, `rejected`, or `suspended` to remove a
source's records from public eligibility without deleting synchronized data.
