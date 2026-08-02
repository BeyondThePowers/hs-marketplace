# Marketplace inquiry handoff architecture

Status: Source endpoints implemented for ABH and JJ

Last reviewed: 2026-08-01

## Product boundary

The marketplace is a public discovery, comparison, and referral product. It
does not require marketplace user accounts, saved hunts, messaging, an inbox,
or a second lead-management system.

When an outfitter deployment advertises a compatible inquiry endpoint, the
marketplace should present the inquiry form directly on the hunt page. Sending
the hunter to another website at the moment of intent is a functional fallback,
not the preferred experience.

The outfitter's marketing deployment remains responsible for its inquiry
experience. Its server-side inquiry function may create the lead in that
outfitter's portal, send email, or use another source-owned delivery mechanism.
The marketplace must not connect directly to an outfitter portal database and
must not receive portal credentials or internal hunt type IDs.

## Supported inquiry modes

Each source declares one public inquiry capability in its feed. The preferred
order is:

1. `source-endpoint`
   The marketplace renders the shared hunt inquiry form and submits it to a
   public endpoint owned by the outfitter's marketing deployment. That endpoint
   validates the submission and routes it to the outfitter's portal or email.
2. `source-page`
   The marketplace sends the visitor to the corresponding hunt page or inquiry
   page on the real outfitter site. This is the required fallback and the
   version 1 behavior.
3. `email-link`
   A limited fallback for an outfitter without a submission endpoint. Prefer a
   source-owned contact page over exposing an email address when possible.

An outfitter can opt into or out of `source-endpoint` independently of its
marketplace listing participation.

## Preferred long-term flow

```text
marketplace hunt page
  -> shared public inquiry form
  -> source marketing-site inquiry endpoint
  -> source resolves listing ID to its private portal routing ID
  -> source portal lead or source-owned email delivery
  -> source returns a non-sensitive confirmation reference
```

This mirrors the inquiry behavior of the outfitter website while keeping the
marketplace independent of the portal.

The marketplace form should share the source form's validated field contract
and behavior, but use the marketplace's neutral visual system. It should not
embed a branded source page or copy independently maintained form logic.

The template, JJ, and ABH already contain the basis for this flow. Their
`submit-booking-inquiry` function validates input and calls the configured
portal API using `PORTAL_API_URL` and `INTERNAL_API_KEY` stored in that
marketing deployment. The marketplace must not copy those credentials.

## Shared public inquiry contract

Add a versioned inquiry capability to the public content contract. It should
contain only public routing and presentation information:

- `mode`;
- `formVersion`;
- `inquiryPageUrl`;
- optional `submissionUrl` for `source-endpoint` mode;
- allowed marketplace origin or origin policy version;
- supported public fields and which are required;
- consent text or policy URL;
- expected success response version; and
- capability update time.

A hunt submission identifies the source and hunt with public `sourceId` and
`listingId`. The source deployment resolves that identity to its own private
`huntTypeId`. Portal identifiers remain excluded from the feed and browser
payload.

The common form payload should support:

- name, email, and optional phone;
- preferred start and end dates;
- hunters and non-hunters;
- special requests;
- public source and listing IDs;
- hunt title and source URL for human-readable context; and
- marketplace referral URL and campaign attribution.

The source endpoint must treat titles, prices, and other browser-supplied hunt
facts as display context only. It resolves authoritative hunt facts from its
own deployment before creating the lead.

## Security and reliability

- Allow only configured marketplace and source-site origins for browser
  submission.
- Validate the shared schema server-side.
- Apply bot protection, rate limiting, payload limits, and honeypot checks at
  the source endpoint.
- Use idempotency keys to reduce duplicate leads caused by retries.
- Keep portal API credentials inside the source marketing deployment.
- Return a generic error to the visitor and log actionable details privately.
- Record marketplace attribution in the resulting lead without creating a
  marketplace user account.
- Do not store inquiry PII in the marketplace unless a later, explicit product
  decision and privacy design require it.

Cross-origin browser submission is the preferred first implementation because
it keeps the marketplace out of the PII and delivery path. If browser or bot
protection constraints make that unreliable, a thin marketplace relay may be
introduced later. A relay must forward directly to the registered source
endpoint, retain no message history, use per-source authentication, and avoid
becoming a marketplace inbox.

## Rollout

1. Keep the current `inquiryUrl` link-out behavior only while the static catalog
   and shared inquiry contract are built.
2. Add the versioned public inquiry contract and generated private listing ID
   routing map to the canonical marketing template.
3. Update the source inquiry function to accept `listingId`, enforce origin and
   abuse controls, and preserve marketplace attribution.
4. Apply the same update to JJ and ABH.
5. Make the shared form the primary hunt-page action for every source
   advertising a compatible `source-endpoint` capability.
6. Fall back to `source-page` whenever capability validation fails or the
   source endpoint is unavailable.
7. Test that submissions from both marketplace and source-site forms create
   equivalent leads in the correct outfitter workspace.

## Implementation status on 2026-08-01

- The canonical marketing template generates a private listing-to-hunt-type
  routing map during each build. Portal hunt type IDs never enter the public
  feed or marketplace browser payload.
- The source-owned `/api/submit-marketplace-inquiry` function validates the
  marketplace origin, listing ID, request size, and honeypot before delegating
  to the established booking inquiry and portal delivery path.
- Each deployment must explicitly set `MARKETPLACE_INQUIRIES_ENABLED=1` and
  `MARKETPLACE_ALLOWED_ORIGINS`; possession of portal credentials alone does
  not enable cross-origin inquiries.
- ABH advertises `source-endpoint` and the marketplace pre-renders its form on
  all six ABH hunt pages.
- JJ has five client-specific operational portal hunt types with stable private
  IDs and its build generates all five routes. A new development internal API
  key is configured on the JJ portal and marketing deployment. JJ now advertises
  `source-endpoint` and the marketplace renders its direct forms.
- The marketplace does not store form contents or receive either source's
  portal credentials.

The portal's legacy `opportunities.source` constraint accepts `api`, but not a
dedicated `marketplace` value. Marketing endpoints therefore store `source` as
`api` for compatibility while retaining the more precise
`inquiry_data.referral_source = huntseeker-marketplace`, public listing ID, and
referral URL. The canonical portal migration
`20260801000000_add_marketplace_opportunity_source.sql` adds a dedicated value
for a future coordinated portal schema rollout. The endpoints should switch to
that value only after every target portal database has received the migration.

End-to-end development inquiries passed on 2026-08-01:

- JJ created opportunity `OPP-2026-0001` from the Córdoba Dove marketplace
  listing.
- ABH created opportunity `OPP-2026-0011` from the Axis and Blackbuck
  marketplace listing.
- Both returned only a non-sensitive confirmation reference to the browser.
- Both records are labeled `HuntSeeker Integration Test` and `Safe to delete`.
- Wrong-listing, wrong-origin, and unknown-listing rejection paths also passed.
