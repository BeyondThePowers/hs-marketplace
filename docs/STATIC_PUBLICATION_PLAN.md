# Marketplace static publication implementation plan

Status: Core static catalog, revision-driven deployment automation, and semantic discovery implemented

Last reviewed: 2026-08-01

## Delivery decision

No public marketplace request should fetch an outfitter marketing feed. Feeds
are static source publications consumed only by background reconciliation.

The public catalog is produced from the marketplace's last accepted central
revision:

```text
marketing-site static feeds
  -> scheduled or webhook-requested reconciliation
  -> validation and normalized central marketplace revision
  -> content-hash change detection
  -> debounced Netlify build
  -> atomic static pages, metadata, sitemaps, and discovery indexes
```

Ordinary hunt availability, seasons, and prices are catalog facts refreshed by
this cycle. They are not treated as live transactional inventory. Each volatile
fact must support a source update or verification time so the marketplace can
state its freshness honestly.

Request-time services are reserved for the source-owned inquiry handoff,
future bookable inventory, private operations, and the small
fail-closed participation guard. The marketplace does not require user
accounts, saved hunts, messaging, or its own inquiry inbox.

## Freshness policy

- Run universal pull reconciliation on the existing hourly schedule.
- Accept optional authenticated source webhooks after marketing-site deploys
  to request an earlier pull.
- Never trust hunt content inside a webhook. Always refetch the registered
  static feed.
- Compare stable public-content hashes and do not build when public output is
  unchanged.
- Debounce and coalesce changes from multiple sources into one build.
- Publish from one accepted revision so HTML, search data, structured data, and
  sitemaps cannot describe different catalog versions.
- Verify the live deployment revision after Netlify publishes it.
- Display `updatedAt` or `lastVerifiedAt` for facts whose age matters.

This gives routine updates a maximum expected delay of the reconciliation
interval plus build time. Webhooks normally reduce that delay to ingestion plus
build time.

## Static discovery decision

The first faceted search implementation uses a compact generated catalog index,
not a live Supabase request:

- include only normalized fields required for cards, filters, comparisons,
  sorting, and approximate map display;
- keep full descriptions, galleries, itineraries, terms, and lodge narratives
  in their prebuilt entity pages;
- encode active source and listing identity so the participation guard can
  suppress disabled results;
- place the catalog revision in the filename or response metadata;
- preserve filters in the URL so searches can be shared and browser navigation
  works; and
- generate prebuilt HTML landing pages for valuable destination, species,
  method, and category combinations.

Measure compressed transfer size, parse time, memory, and filter latency. Shard
the index by destination or stable taxonomy when budgets are exceeded. Add a
marketplace-owned server search endpoint only if measured catalog growth makes
the sharded static index slower or heavier than a remote query.

## Implementation sequence

## Implementation status on 2026-08-01

- Version 2 feed validation and normalization are live for JJ Cacería and ABH.
- The canonical template, JJ, and ABH publish the same version 2 contract.
- Internal editorial notes are removed by the feed generator before publication.
- Central publication revisions and stable accepted source hashes are stored.
- `marketplace_get_public_catalog()` returns all public entity sets from one
  PostgreSQL statement, preventing mixed-time build snapshots.
- The marketplace pre-renders the discovery page, 11 hunt pages, and 2
  outfitter pages from one memoized snapshot per build. Lodge pages are
  generated only when a source explicitly enables one.
- `/catalog-index.json` is static, contains the public decision model for
  answer engines and downstream consumers, and identifies its content with a
  stable SHA-256 revision. The smaller browser search payload remains embedded
  separately in the catalog HTML.
- Discovery filters run in the browser over HTML that already contains every
  hunt card. Filter state is preserved in shareable URL parameters.
- Hunt, lodge, outfitter, and collection pages emit canonical metadata and
  structured data. Astro generates the sitemap from the static routes.
- Public entity routes make no request-time Supabase or source-feed calls.
- `/health.json`, protected source diagnostics, reconciliation, and webhooks
  remain dynamic operational routes.

The semantic hunt renderer, participation guard, destination pages, and
species pages are now implemented. The remaining essential work is measured
mobile, accessibility, and performance testing, followed by method and trip
type landing pages when the catalog is broad enough to make them useful.

### 1. Lock the public contract

- Create the versioned shared content contract.
- Normalize species, location, methods, territory, party, pricing, season,
  availability, travel, terms, lodge references, guides, and media.
- Make lodges first-class feed entities and remove duplicated lodge authority
  from hunt snapshots.
- Keep version 1 ingestion working during migration.

Exit condition: the template, JJ, ABH, and marketplace can validate the same
version 2 feed without losing a public fact shown on a marketing hunt page.

### 2. Add central publication revisions

- Store accepted source hashes and a global public catalog revision.
- Record which sources and entities changed in each revision.
- Record build requested, build started, deployed, verified, and failed states.
- Ensure a failed source pull does not damage the last accepted revision.

Exit condition: ingestion can say deterministically whether public output
changed and which revision should be built.

### 3. Build one static marketplace snapshot

- Add a build-time data loader that reads exactly one accepted revision.
- Prebuild hunt, outfitter, lodge, taxonomy, and curated landing routes.
- Generate the static discovery index, metadata, JSON-LD, robots rules, and
  complete sitemaps from that same snapshot.
- Keep primary page content in HTML and use client JavaScript only for
  progressive enhancement.

Exit condition: the public catalog can be browsed and searched with no runtime
database or source-feed dependency.

### 4. Implement the complete hunt renderer

- Replace the provisional generic-section page with the shared semantic page
  model.
- Cover package facts, outfitter, gallery, overview, itinerary, territory,
  methods, lodge, travel, equipment, licenses, inclusions, exclusions, terms,
  payments, FAQs, approximate map context, and related hunts.
- Add centrally owned reviews and response metrics only when those systems
  exist, with clear provenance.

Exit condition: any public fact available on the outfitter hunt page can be
represented on the marketplace page.

### 5. Automate changed-content deployments

- Configure one protected Netlify build hook for the marketplace.
- Trigger it only after a changed accepted revision.
- Add a short debounce lock so simultaneous source updates produce one build.
- Pass or store the intended revision and verify it after deployment.
- Alert when accepted and deployed revisions diverge beyond the freshness
  window.

Exit condition: changing a JJ or ABH feed produces a verified marketplace
update, while an unchanged reconciliation produces no deployment.

### 6. Add participation safety

- Generate a compact source-status manifest.
- Put a lightweight edge guard in front of public source-owned entity routes.
- On pause, withdrawal, or central moderation, update and invalidate the
  manifest, suppress search results, and request a high-priority rebuild.
- Confirm the guard does not query Supabase or an outfitter feed per page view.

Exit condition: a source can be disabled before a static rebuild completes,
and the next deployment removes its pages and references entirely.

### 7. Validate and tune

- Run contract, ingestion, route, and withdrawal tests against JJ and ABH.
- Test mobile filtering and the complete hunt page with JavaScript disabled and
  enabled.
- Measure static HTML, discovery-index transfer, image behavior, Core Web
  Vitals, build duration, and publication delay.
- Validate canonical URLs, structured data, sitemaps, answer-engine resources,
  and source attribution.
- Add index sharding or selective build optimization only in response to
  measured limits.

Exit condition: both development outfitters participate, the complete catalog
is static and searchable, updates meet the freshness policy, and source
withdrawal fails closed.

## Immediate next work

1. Complete the semantic hunt renderer for territory, methods, travel,
   equipment, license, pricing options, terms, and related packages.
2. Connect accepted publication revisions to a debounced Netlify build hook and
   verify the deployed revision after publication.
3. Add a fast source participation guard and test pause and withdrawal.
4. Add static destination, species, method, and category landing pages.
5. Run mobile, accessibility, answer-engine, and performance measurements.

## Discovery and hunt page implementation on 2026-08-01

- Hunt pages now render structured methods and guiding, season and availability,
  all price options, deposits and payment timing, accommodation, travel,
  equipment and licenses, territory when supplied, inclusions, exclusions,
  optional services, itinerary, terms, media, and related hunts.
- The generated discovery index exposes the same normalized decision fields as
  the HTML pages. This is a public static artifact and does not query source
  feeds or Supabase at request time.
- Catalog filtering now covers search, country, region, primary or secondary
  species, trip type, hunting method, maximum starting price, and minimum
  hunting days. Filter state remains shareable in the URL.
- Region and species landing pages are generated from the accepted catalog
  snapshot. They have canonical metadata, JSON-LD item lists, sitemap entries,
  and direct links from the marketplace and hunt pages.
- `/llms.txt` points answer engines to the structured public catalog, sitemap,
  taxonomy pages, and every current hunt. Hunt pages provide Product and
  BreadcrumbList JSON-LD with seller, area, species, duration, season, guiding,
  and offer facts.
- Reviews, success rates, live inventory, precise territory maps, and booking
  transactions are not inferred from marketing prose. They should be added
  only through explicit contract fields and reliable source or
  marketplace-owned systems.

## Marketplace interface architecture on 2026-08-01

- The initial compact filter grid was replaced after visual review. Desktop
  discovery now uses a persistent grouped filter sidebar, while smaller screens
  use the same semantic form in an off-canvas drawer with a backdrop, close
  control, active-filter count, and Escape-key handling.
- Filter groups separate destination, hunting experience, and budget or trip
  length. Selected values appear as removable chips above the results. The
  static browser index remains the only data source for filtering.
- Catalog results use two decision-oriented columns on wide screens rather
  than three compressed promotional cards. Cards now show media count,
  location, outfitter, starting price, season, duration, guiding, method, and
  species without requiring a detail-page visit.
- Hunt detail pages use a 1,400-pixel maximum canvas with a broad reading
  column and a dedicated inquiry column. A media mosaic and native dialog
  gallery appear before the semantic content, followed by an anchored section
  navigation bar.
- Hunt sections are visually grouped as deliberate decision panels instead of
  a continuous sequence of equally weighted divider rows. Mobile places the
  reading content before the full inquiry form and provides a compact fixed
  availability action.
- The redesign retains static HTML, source-owned inquiry routing, canonical
  data, structured metadata, and participation filtering. Visual behavior was
  tested at 1,440 and 390 CSS pixels against the live 11-hunt development
  catalog.

## Faceted discovery contract on 2026-08-01

- Categorical filters are true multi-select facets. Values within species,
  hunt type, hunting method, and destination use OR. Different facets use AND.
  This is the default interaction model and URL contract, not a temporary
  client-side shortcut.
- Destination is one hierarchical facet. Country parents and region children
  are alternatives within that facet, so hunters can compare several regions
  or a whole country without constructing a Boolean query.
- Species defaults to matching any selected species. Once two species are
  selected, the interface reveals a plain-language option for hunts that
  include every selected species. This supports deliberate combination-hunt
  searches without exposing an advanced query builder.
- Price and duration remain numeric constraints rather than categorical
  facets. Future availability filtering must use date-window overlap, and
  independent requirements such as equipment rental or accessibility must be
  modeled as AND capabilities.
- Counts are contextual and disjunctive. Each value count respects search,
  numeric constraints, participation controls, and every other facet while
  ignoring selections in its own facet. Selected zero-count values remain
  removable; unavailable unselected values are disabled.
- Desktop applies changes immediately. Mobile stages changes in the drawer and
  exposes the prospective result count in a sticky `Show X hunts` action. A
  dismissed drawer restores the committed state.
- Repeated query parameters preserve multi-selection in shareable URLs, for
  example `species=Dove&species=Duck`. `speciesMode=all` is emitted only when
  the every-species option is active.
- Facet evaluation is isolated in `src/lib/facet-engine.ts`, independent of the
  current static browser index. The same state and URL contract can later run
  against a sharded static index or server search without redesigning the
  interface.
- A separate simple and advanced mode is intentionally avoided. Progressive
  disclosure keeps the normal case direct while revealing the combination
  species rule only when it can change the meaning of a search.
- Species is one grouped facet, not several competing filters. Non-selectable
  pursuit headings organize species into Big game, Game birds, Fishing, Small
  game, and a compatibility fallback. Optional species-group headings provide
  useful distinctions such as Waterfowl, Dove and pigeon, and Upland birds.
  Both primary and secondary species are selectable. The hierarchy is
  published as stable taxonomy metadata in the source feed and is never
  inferred from hunt prose by the interface.
- Taxonomy landing pages remain part of the static publication and answer
  engine surface, but the former destination and species pill strip was
  removed from the catalog because static links styled as filter chips created
  a misleading second discovery control. Applied-filter chips remain visible
  above results because they communicate and remove the active search state.
- The former hunting-method facet has been replaced by independent Equipment,
  Hunt style, Terrain, and Access facets. Their source and compatibility rules
  are defined in `HUNT_TAXONOMY_CONTRACT.md`. The marketplace does not infer
  these values from prose or split legacy values with runtime heuristics.

Completed since this plan was written:

- Source-owned inquiry endpoints are live for JJ and ABH, and controlled
  marketplace submissions created correctly routed portal opportunities.
- Hunt accommodation supports both verified lodge references and factual
  arranged accommodation. Standalone marketplace lodge pages are explicit
  opt-ins. See `LODGING_PRESENTATION_POLICY.md`.
- Repeated source reconciliation is idempotent, including already orphaned
  records.
