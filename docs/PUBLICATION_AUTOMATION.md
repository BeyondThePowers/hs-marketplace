# Marketplace publication automation

Status: Implemented for the development marketplace

Last reviewed: 2026-08-01

## Objective

Publish accepted catalog changes automatically without rebuilding for unchanged
feeds or allowing concurrent source updates to trigger duplicate builds.

## Flow

```text
source reconciliation
  -> changed public content creates a pending publication revision
  -> minute scheduler claims the newest eligible revision
  -> older pending revisions become superseded
  -> protected Netlify build hook builds main
  -> static build embeds publication revision ID and hash
  -> deploy-succeeded reads the deployed catalog marker
  -> matching revision becomes verified
```

Unchanged synchronization creates no publication revision and therefore no
build. A database advisory lock permits only one active build claim. A request
older than the configured stale timeout becomes failed so the queue can recover.

## Components

- `marketplace_claim_publication_build` atomically claims the newest eligible
  pending revision after a 30-second debounce window.
- `scheduled-publication-build` runs every minute and calls the protected build
  hook only when a revision was claimed.
- `/catalog-index.json` includes the catalog content hash and the accepted
  publication revision ID, hash, and acceptance time used by that build.
- `deploy-succeeded` fetches the immutable deployment URL, validates the marker,
  and records the deployment as verified.
- `deploy-failed` marks the active request failed. A newer pending revision can
  then be claimed by the next scheduled check.

## Required environment

The marketplace Netlify site requires:

- `MARKETPLACE_BUILD_HOOK_URL`, stored as a secret and scoped to production;
- the existing marketplace Supabase URL, anonymous key, and service-role key.

The build hook is scoped to the repository's `main` branch. Its URL must never
be included in browser code, source feeds, logs, or committed environment files.

## Operational checks

1. Run an unchanged source reconciliation and confirm no revision or build is
   created.
2. Publish a real source content change and confirm one pending revision.
3. Confirm the scheduler changes it to `requested` and starts one Netlify build.
4. Confirm the deployed `/catalog-index.json` marker matches a `verified`
   database revision and records the immutable deployment URL.
5. Confirm older coalesced revisions are `superseded`.
6. Simulate a failed build in development and confirm the request becomes
   `failed` without altering the last verified public deployment.

## Development verification on 2026-08-01

- Unchanged reconciliations for JJ and ABH produced zero entity changes, zero
  pending revisions, and zero Netlify deployments.
- The latest verified revision was deliberately requeued as a no-content-change
  forced republish.
- The minute scheduler claimed it once after the debounce window.
- Netlify deployed commit `f07d2d3` once as deployment
  `6a6e9959a5fb990008ed611f`.
- The deploy event matched the embedded revision ID and hash and changed the
  database record to `verified`.
