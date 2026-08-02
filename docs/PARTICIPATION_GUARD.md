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
