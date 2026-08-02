# Marketplace participation guard

Status: Implemented for development verification

Last reviewed: 2026-08-01

## Purpose

Static marketplace pages are rebuilt after participation or moderation changes,
but an outfitter pause or withdrawal must take effect before that build finishes.
The participation guard provides this short safety window without querying
Supabase for every public request.

## Mechanism

- A compact manifest maps public hunt, outfitter, and lodge IDs to their source
  and records whether each source is currently public.
- A scheduled server function refreshes the site-wide Netlify Blob every minute.
- The edge guard reads the manifest with strong consistency and caches it inside
  an edge isolate for no more than ten seconds.
- Inactive entity routes return `404` with `noindex` metadata.
- The catalog JSON excludes inactive-source hunts.
- The static discovery page receives an edge-injected source suppression rule,
  and its filter logic excludes the same records from result counts.
- A generated build-time manifest is available only when the site-wide store has
  not yet been initialized. Blob read failures return `503` instead of serving a
  potentially withdrawn entity.

## Permanent removal

Participation, feed-enabled, and central moderation changes create pending
publication revisions in the same database transaction. The normal publication
queue therefore rebuilds the static catalog and removes inactive entities. The
guard remains the fast temporary enforcement layer while that build runs.

## Development verification on 2026-08-01

JJ was temporarily paused and restored using the audited participation command.

- The central public hunt count for JJ changed from five to zero immediately.
- The edge catalog changed from 11 hunts to 6, and a known JJ hunt changed from
  HTTP 200 to HTTP 404, within 18 seconds.
- The pause created publication revision
  `f36ea562-ea0e-46fc-b8e4-80679f66d130` and verified deployment
  `6a6e9ea11ba2a10008a05ac2`.
- Reactivation restored all five central public hunts and created revision
  `f0f12c60-00dc-4744-a421-9f042cb15a25`.
- Deployment `6a6e9f1da0a42c00088c651e` restored the live 11-hunt catalog and
  the JJ hunt route to HTTP 200.
- Both sources finished active and no publication revision finished with an
  error.

Reactivation can require the static rebuild when the pause deployment has
already removed the source's files. Fast suppression is the safety guarantee;
restoration is publication-driven so a route is never served without a current
static artifact.
