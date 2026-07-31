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

## Source registration

Register one row per marketing deployment in `marketplace_sources`. A source
starts disabled. Its `content_feed_url` must be the exact HTTPS URL the feed
declares in `source.feedUrl`.

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

After the feed validates, configure its credential hash and enable the source.
Never reuse a webhook secret between outfitters.

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
for every enabled source.

## Diagnostics

`/admin/source-health` is protected with HTTP Basic authentication and fails
closed when its credentials are absent. It displays registration, webhook,
feed, synchronization, failure, listing, publication, and orphan status without
displaying credential hashes or secrets.

## Promotion checklist

1. Apply migrations to a dedicated marketplace staging project.
2. Configure marketplace server and diagnostics credentials.
3. Deploy corrected JJ and ABH feeds.
4. Confirm each deployed feed's self-declared URLs match its deployment.
5. Generate and configure separate source webhook credentials.
6. Enable JJ, run reconciliation twice, and confirm idempotency.
7. Repeat for ABH.
8. Approve central moderation only after source facts are ready.
