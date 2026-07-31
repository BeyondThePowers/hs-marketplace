# Marketplace deployment registry

Last verified: 2026-07-31

This document records non-secret deployment identities and marketplace
onboarding state. API keys, database passwords, synchronization secrets, and
service-role credentials must remain in ignored environment files or the
deployment provider's secret store.

## ABH development deployment

| Role | Deployment |
| --- | --- |
| Marketing site | `https://abh-website-demo.huntseeker.pro/` |
| Outfitter portal | `https://abh-admin-demo.huntseeker.pro/` |
| Hunter portal | `https://abh-portal-demo.huntseeker.pro/` |
| Supabase project ref | `smrghhputffiwmssrbbp` |
| Marketplace source ID | `b32d88f2-75bb-4b7d-b4e7-2d737cf44853` |

Verified state:

- The marketplace integration reads the ABH marketing site's hunt collection.
  It does not read either portal database.
- The local marketing build publishes six active draft records with stable
  listing IDs at `/marketplace-feed.json`.
- The local feed passed contract validation and a real central reconciliation.
- The updated marketing build still needs to be deployed before this source can
  be enabled for routine synchronization.
- The current live feed URL returns 404.

## JJ Caceria development deployment

| Role | Deployment |
| --- | --- |
| Marketing site | `https://jj-caceria-preview.netlify.app/` |
| Outfitter portal | `https://hs-jjcaceria-workspace.netlify.app/` |
| Hunter portal | Not currently identified |
| Supabase project ref | `nvgbqslhnbubtrkhqwew` |
| Marketplace source ID | `6241f059-8fbe-4ea0-9901-353702c1bcd6` |

Verified state:

- The marketplace integration reads the JJ marketing site's hunt collection.
  It does not read the outfitter portal database.
- The local marketing build publishes five active draft records with stable
  listing IDs at `/marketplace-feed.json`.
- The local feed passed contract validation and a real central reconciliation.
- The rebuilt feed identifies the preview deployment as its source. The updated
  marketing build still needs to be deployed before this source can be enabled
  for routine synchronization.
- The current live preview feed returns 200 but still declares
  `https://jjcaceria.com.ar/marketplace-feed.json` as its identity. This does not
  match the registered preview URL, so synchronization must remain disabled
  until the rebuilt feed is deployed.
- Package facts still require approval before records can move from `draft` to
  `ready`.

## Marketplace deployment

A dedicated development Supabase project has been identified:

| Role | Deployment |
| --- | --- |
| Supabase project ref | `gwuuxsxkrfqvvaelsoah` |
| Netlify site | Not currently provisioned |

The Supabase CLI is linked to this project. All three committed migrations and
the disabled development source registry seed were applied on 2026-07-31.
The local marketplace runtime is configured through its ignored `.env` file.

The complete ingestion path was verified against locally served public builds
and this remote database:

- JJ imported 5 hunts and 16 media records. Its immediate repeat imported 0
  changed hunts and 0 changed media records.
- ABH imported 6 hunts and 52 media records. Its immediate repeat imported 0
  changed hunts and 0 changed media records.
- The database contains 11 active, non-orphaned hunt records and 68 media
  records.
- All 11 hunts remain `draft`, `pending_review`, and unpublished.
- Four synchronization runs succeeded and no synchronization errors were
  recorded.
- After verification, both source rows were restored to their public HTTPS URLs
  and disabled.

## Immediate next steps

1. Deploy the updated JJ and ABH marketing builds.
2. Verify each live feed's self-declared URL and contract.
3. Provision the central marketplace Netlify site and protected diagnostics.
4. Generate separate webhook credentials for JJ and ABH, configure both ends,
   and enable one source at a time.
5. Run live reconciliation twice for each source and compare it with the local
   end-to-end baseline above.
6. Review package facts, move approved source records to `ready`, and perform
   central moderation before exposing public search pages.
