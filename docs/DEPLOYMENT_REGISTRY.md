# Marketplace deployment registry

Last verified: 2026-08-01

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

- The marketplace reads only the ABH marketing site's public feed. It does not
  read either portal database.
- The live feed returns six active, ready records with stable listing IDs at
  `/marketplace-feed.json`.
- Feed URLs identify the deployed custom domain and no portal IDs are exported.
- Participation is active with development authorization recorded.
- The first readiness reconciliation changed six hunts. Its immediate repeat
  changed zero hunts and zero media records.
- The outfitter and six hunts have audited central development approval and are
  available through the anonymous public views.

## JJ Caceria development deployment

| Role | Deployment |
| --- | --- |
| Marketing site | `https://jj-caceria-preview.netlify.app/` |
| Outfitter portal | `https://hs-jjcaceria-workspace.netlify.app/` |
| Hunter portal | Not currently identified |
| Supabase project ref | `nvgbqslhnbubtrkhqwew` |
| Marketplace source ID | `6241f059-8fbe-4ea0-9901-353702c1bcd6` |

Verified state:

- The marketplace reads only the JJ marketing site's public feed. It does not
  read the outfitter portal database.
- The live feed returns five active, ready records with stable listing IDs at
  `/marketplace-feed.json`.
- Feed URLs identify the Netlify preview deployment and no portal IDs are
  exported.
- Participation is active with development authorization recorded.
- The first readiness reconciliation changed five hunts. Its immediate repeat
  changed zero hunts and zero media records.
- The outfitter and five hunts have audited central development approval and
  are available through the anonymous public views.

## Marketplace deployment

| Role | Deployment |
| --- | --- |
| Supabase project ref | `gwuuxsxkrfqvvaelsoah` |
| Netlify site | `https://huntseeker-marketplace.netlify.app/` |

The development database has all committed migrations through
`20260801000000_source_moderation_controls.sql`. Participation controls,
publication triggers, row-level security, public views, audited moderation,
scheduled reconciliation, authenticated optional webhooks, and protected
source-health diagnostics are installed.

Current public catalog state:

- 2 active, participating outfitters
- 11 ready and centrally approved hunts
- 68 current media records
- 5 JJ hunts and 6 ABH hunts
- 0 changes on immediate repeat reconciliation for either source
- Anonymous reads verified through `marketplace_public_hunts`,
  `marketplace_public_outfitters`, and `marketplace_public_hunt_media`

The first server-rendered catalog supports text, country, and species filters.
Marketplace-owned hunt detail pages use stable listing IDs and send inquiry
traffic to the publishing outfitter.
Dynamic catalog and detail responses use `Cache-Control: no-cache` so source
reconciliation, participation pauses, and moderation changes take effect on
the next request without a marketplace redeploy.

Development moderation approval allows interface and synchronization testing.
Before a production release, the source records still require a final fact and
copy review with each outfitter. Some JJ structured terms fields retain
verification notes that the initial marketplace detail renderer intentionally
does not display.

## Next steps

1. Complete visual and responsive review of the initial catalog and detail
   pages.
2. Review JJ and ABH facts and remove internal verification language before a
   production release.
3. Add pagination and database-side faceting as the source count grows.
4. Add marketplace sitemap entries and richer hunt structured data.
5. Add source-level pause and moderation controls to an authenticated operator
   interface. The audited CLI and database functions remain the authoritative
   controls until that interface exists.
