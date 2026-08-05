import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';
import { contentHash } from './content-hash';
import { MarketplaceAnyContentFeedSchema } from './marketplace-content-schema';
import { normalizeMarketplaceFeed, type NormalizedFeed, type NormalizedHunt } from './normalize-marketplace-feed';
import { assertSafeFeedUrl } from './source-security';
import { createServiceClient } from './supabase-server';

export type SyncTrigger = 'webhook' | 'scheduled' | 'manual';

export type SyncResult = {
  sourceId: string;
  status: 'success' | 'failed';
  huntsSeen: number;
  huntsChanged: number;
  mediaChanged: number;
  lodgesSeen: number;
  lodgesChanged: number;
  durationMs: number;
  error?: string;
};

type UntypedClient = SupabaseClient<any>;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown synchronization error';
}

async function fetchFeed(feedUrl: string) {
  const url = assertSafeFeedUrl(feedUrl);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Source feed returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`Source feed returned unsupported content type: ${contentType || 'missing'}`);
  }
  return normalizeMarketplaceFeed(MarketplaceAnyContentFeedSchema.parse(await response.json()));
}

async function syncMedia(
  supabase: SupabaseClient<Database>,
  huntId: string,
  feed: NormalizedHunt,
  now: string
) {
  const incoming = feed.media;
  const { data: existing, error: existingError } = await supabase
    .from('marketplace_hunt_media')
    .select('id, source_url, alt, caption, role, sort_order, status')
    .eq('hunt_id', huntId);
  if (existingError) throw existingError;

  const existingByUrl = new Map((existing ?? []).map((item) => [item.source_url, item]));
  let changed = 0;
  for (const media of incoming) {
    const previous = existingByUrl.get(media.url);
    if (
      !previous ||
      previous.alt !== media.alt ||
      previous.caption !== (media.caption ?? null) ||
      previous.role !== media.role ||
      previous.sort_order !== media.sortOrder ||
      previous.status === 'orphaned'
    ) changed += 1;
  }

  if (incoming.length) {
    const { error } = await supabase.from('marketplace_hunt_media').upsert(
      incoming.map((media) => ({
        hunt_id: huntId,
        source_url: media.url,
        alt: media.alt,
        caption: media.caption ?? null,
        role: media.role,
        sort_order: media.sortOrder,
        source_hash: contentHash(media),
        status: 'source',
        last_checked_at: now,
        orphaned_at: null,
        updated_at: now,
      })),
      { onConflict: 'hunt_id,source_url' }
    );
    if (error) throw error;
  }

  const incomingUrls = new Set(incoming.map((media) => media.url));
  const orphanedIds = (existing ?? [])
    .filter((media) => !incomingUrls.has(media.source_url) && media.status !== 'orphaned')
    .map((media) => media.id);
  if (orphanedIds.length) {
    const { error } = await supabase
      .from('marketplace_hunt_media')
      .update({ status: 'orphaned', orphaned_at: now, updated_at: now })
      .in('id', orphanedIds);
    if (error) throw error;
    changed += orphanedIds.length;
  }
  return changed;
}

async function syncLodgeMedia(
  supabase: UntypedClient,
  lodgeRecordId: string,
  mediaItems: NormalizedFeed['lodges'][number]['media'],
  now: string
) {
  const { data: existing, error: existingError } = await supabase
    .from('marketplace_lodge_media')
    .select('id, source_url, alt, caption, role, sort_order, status')
    .eq('lodge_record_id', lodgeRecordId);
  if (existingError) throw existingError;

  const existingByUrl = new Map((existing ?? []).map((item: any) => [item.source_url, item]));
  let changed = 0;
  for (const media of mediaItems) {
    const previous = existingByUrl.get(media.url) as any;
    if (
      !previous ||
      previous.alt !== media.alt ||
      previous.caption !== (media.caption ?? null) ||
      previous.role !== media.role ||
      previous.sort_order !== media.sortOrder ||
      previous.status === 'orphaned'
    ) changed += 1;
  }

  if (mediaItems.length) {
    const { error } = await supabase.from('marketplace_lodge_media').upsert(
      mediaItems.map((media) => ({
        lodge_record_id: lodgeRecordId,
        source_url: media.url,
        alt: media.alt,
        caption: media.caption ?? null,
        role: media.role,
        sort_order: media.sortOrder,
        source_hash: contentHash(media),
        status: 'source',
        last_checked_at: now,
        orphaned_at: null,
        updated_at: now,
      })),
      { onConflict: 'lodge_record_id,source_url' }
    );
    if (error) throw error;
  }

  const incomingUrls = new Set(mediaItems.map((media) => media.url));
  const orphanedIds = (existing ?? [])
    .filter((media: any) => !incomingUrls.has(media.source_url) && media.status !== 'orphaned')
    .map((media: any) => media.id);
  if (orphanedIds.length) {
    const { error } = await supabase
      .from('marketplace_lodge_media')
      .update({ status: 'orphaned', orphaned_at: now, updated_at: now })
      .in('id', orphanedIds);
    if (error) throw error;
    changed += orphanedIds.length;
  }
  return changed;
}

async function syncLodges(
  supabase: UntypedClient,
  feed: NormalizedFeed,
  sourceId: string,
  now: string
) {
  const { data: existing, error: existingError } = await supabase
    .from('marketplace_lodges')
    .select('id, lodge_id, content_hash, source_active, orphaned_at')
    .eq('source_id', sourceId);
  if (existingError) throw existingError;
  const existingByPublicId = new Map((existing ?? []).map((lodge: any) => [lodge.lodge_id, lodge]));
  const lodgeRecordsByPublicId = new Map<string, string>();
  let lodgesChanged = 0;
  let lodgeMediaChanged = 0;

  for (const lodge of feed.lodges) {
    const previous = existingByPublicId.get(lodge.lodgeId) as any;
    if (!previous || previous.content_hash !== lodge.contentHash) lodgesChanged += 1;
    const { data: stored, error } = await supabase
      .from('marketplace_lodges')
      .upsert(
        {
          source_id: sourceId,
          lodge_id: lodge.lodgeId,
          slug: lodge.slug,
          source_url: lodge.sourceUrl,
          name: lodge.name,
          classification: lodge.classification ?? null,
          atmosphere_line: lodge.atmosphereLine ?? null,
          summary: lodge.summary,
          publication_scope: lodge.publicationScope,
          standalone_page: lodge.standalonePage,
          location: lodge.location,
          arrival: lodge.arrival ?? null,
          capacity: lodge.capacity,
          rooms: lodge.rooms ?? null,
          amenities: lodge.amenities,
          dining: lodge.dining ?? null,
          service: lodge.service ?? null,
          suitability: lodge.suitability ?? null,
          highlights: lodge.highlights,
          faqs: lodge.faqs,
          raw_content: lodge,
          content_hash: lodge.contentHash,
          content_updated_at: lodge.contentUpdatedAt,
          source_active: lodge.active,
          last_seen_at: now,
          orphaned_at: null,
          updated_at: now,
        },
        { onConflict: 'source_id,lodge_id' }
      )
      .select('id')
      .single();
    if (error) throw error;
    lodgeRecordsByPublicId.set(lodge.lodgeId, stored.id);
    lodgeMediaChanged += await syncLodgeMedia(supabase, stored.id, lodge.media, now);
  }

  const incomingIds = new Set(feed.lodges.map((lodge) => lodge.lodgeId));
  const missingIds = (existing ?? [])
    .filter((lodge: any) => !incomingIds.has(lodge.lodge_id) && (lodge.source_active || !lodge.orphaned_at))
    .map((lodge: any) => lodge.id);
  if (missingIds.length) {
    const { error } = await supabase
      .from('marketplace_lodges')
      .update({ source_active: false, published: false, orphaned_at: now, updated_at: now })
      .in('id', missingIds);
    if (error) throw error;
    lodgesChanged += missingIds.length;
  }

  return { lodgesChanged, lodgeMediaChanged, lodgeRecordsByPublicId };
}

async function syncHuntDestinations(
  supabase: UntypedClient,
  huntId: string,
  destinations: NormalizedFeed['hunts'][number]['destinations'],
  now: string
) {
  const { data: existing, error: existingError } = await supabase
    .from('marketplace_hunt_destinations')
    .select('id, country_key, region_key')
    .eq('hunt_id', huntId);
  if (existingError) throw existingError;

  const incomingKeys = new Set(destinations.map(({ country, region }) => `${country.key}:${region.key}`));
  const obsoleteIds = (existing ?? [])
    .filter((destination: any) => !incomingKeys.has(`${destination.country_key}:${destination.region_key}`))
    .map((destination: any) => destination.id);
  if (obsoleteIds.length > 0) {
    const { error } = await supabase.from('marketplace_hunt_destinations').delete().in('id', obsoleteIds);
    if (error) throw error;
  }

  const rows = destinations.map((destination, sortOrder) => ({
    hunt_id: huntId,
    country_key: destination.country.key,
    country_name: destination.country.name,
    region_key: destination.region.key,
    region_name: destination.region.name,
    privacy_mode: destination.privacyMode,
    coordinates: destination.coordinates ?? null,
    sort_order: sortOrder,
    updated_at: now,
  }));
  const { error } = await supabase
    .from('marketplace_hunt_destinations')
    .upsert(rows, { onConflict: 'hunt_id,country_key,region_key' });
  if (error) throw error;
}

async function syncHuntLodgeRelations(
  supabase: UntypedClient,
  huntId: string,
  hunt: NormalizedHunt,
  lodgeRecordsByPublicId: Map<string, string>,
  now: string
) {
  const raw = hunt.rawContent as Record<string, any>;
  if (!Array.isArray(raw.accommodations)) return;

  const { error: deleteError } = await supabase
    .from('marketplace_hunt_lodges')
    .delete()
    .eq('hunt_id', huntId);
  if (deleteError) throw deleteError;

  const rows = raw.accommodations
    .map((accommodation: any, index: number) => ({ accommodation, index }))
    .filter(({ accommodation }: any) => accommodation.type === 'lodge')
    .map(({ accommodation, index }: any) => {
      const lodgeRecordId = lodgeRecordsByPublicId.get(accommodation.lodgeId);
      if (!lodgeRecordId) throw new Error(`${hunt.slug}: unknown ingested lodgeId ${accommodation.lodgeId}`);
      return {
        hunt_id: huntId,
        lodge_record_id: lodgeRecordId,
        region_key: accommodation.regionKey,
        region_name: accommodation.regionName,
        usage: accommodation.usage,
        included_nights: accommodation.includedNights ?? null,
        summary: accommodation.summary ?? null,
        transfer_notes: accommodation.transferNotes ?? null,
        sort_order: index,
        updated_at: now,
      };
    });
  if (!rows.length) return;
  const { error } = await supabase.from('marketplace_hunt_lodges').insert(rows);
  if (error) throw error;
}

async function recordPublicationRevision(
  supabase: UntypedClient,
  sourceId: string,
  acceptedContentHash: string,
  changed: boolean,
  now: string
) {
  const { error: sourceError } = await supabase
    .from('marketplace_sources')
    .update({ last_accepted_content_hash: acceptedContentHash, last_accepted_at: now })
    .eq('source_id', sourceId);
  if (sourceError) throw sourceError;
  if (!changed) return null;

  const { data: sources, error: sourcesError } = await supabase
    .from('marketplace_sources')
    .select('source_id, last_accepted_content_hash')
    .eq('participation_status', 'active')
    .order('source_id');
  if (sourcesError) throw sourcesError;
  const revisionHash = contentHash(
    (sources ?? []).map((source: any) => ({
      sourceId: source.source_id,
      contentHash: source.source_id === sourceId ? acceptedContentHash : source.last_accepted_content_hash,
    }))
  );
  const { data: revision, error } = await supabase
    .from('marketplace_publication_revisions')
    .upsert(
      { revision_hash: revisionHash, changed_source_ids: [sourceId], build_status: 'pending', updated_at: now },
      { onConflict: 'revision_hash', ignoreDuplicates: false }
    )
    .select('id')
    .single();
  if (error) throw error;
  return revision.id as string;
}

async function ingestFeed(
  supabase: SupabaseClient<Database>,
  feed: NormalizedFeed,
  sourceId: string,
  syncRunId: string,
  startedAtMs: number
) {
  const now = new Date().toISOString();
  const snapshotHash = contentHash({ ...feed.rawFeed, generatedAt: undefined });
  const { data: snapshot, error: snapshotError } = await supabase
    .from('marketplace_source_snapshots')
    .upsert(
      {
        source_id: sourceId,
        schema_version: feed.schemaVersion,
        content_hash: snapshotHash,
        payload: feed.rawFeed as unknown as Json,
        accepted: false,
        validation_errors: null,
      },
      { onConflict: 'source_id,content_hash' }
    )
    .select('id')
    .single();
  if (snapshotError) throw snapshotError;

  const { error: sourceError } = await supabase
    .from('marketplace_sources')
    .update({
      name: feed.outfitter.name,
      source_url: feed.source.sourceUrl,
      feed_schema_version: feed.schemaVersion,
      language: feed.source.language,
      feed_enabled: feed.source.enabled,
      last_feed_generated_at: feed.generatedAt,
      updated_at: now,
    })
    .eq('source_id', sourceId);
  if (sourceError) throw sourceError;

  const outfitterPayload = {
    source_id: sourceId,
    name: feed.outfitter.name,
    tagline: feed.outfitter.tagline,
    summary: feed.outfitter.summary,
    profile_url: feed.outfitter.profileUrl,
    inquiry_url: feed.outfitter.inquiryUrl,
    logo: feed.outfitter.logo,
    profile_image: feed.outfitter.profileImage,
    countries: feed.outfitter.countries,
    regions: feed.outfitter.regions,
    founded: feed.outfitter.founded ?? null,
    headquarters: feed.outfitter.headquarters ?? null,
    public_contact: feed.outfitter.contact,
    social_urls: feed.outfitter.social,
    content_hash: contentHash(feed.outfitter.rawContent),
    content_updated_at: feed.generatedAt,
    public_id: sourceId,
    inquiry: feed.outfitter.inquiry,
    raw_content: feed.outfitter.rawContent,
    updated_at: now,
  };
  const untyped = supabase as UntypedClient;
  const { error: outfitterError } = await untyped
    .from('marketplace_outfitters')
    .upsert(outfitterPayload, { onConflict: 'source_id' });
  if (outfitterError) throw outfitterError;

  const lodgeResult = await syncLodges(untyped, feed, sourceId, now);

  const { data: existingHunts, error: existingHuntsError } = await supabase
    .from('marketplace_hunts')
    .select('id, listing_id, content_hash, source_active, orphaned_at')
    .eq('source_id', sourceId);
  if (existingHuntsError) throw existingHuntsError;
  const existingByListing = new Map((existingHunts ?? []).map((hunt) => [hunt.listing_id, hunt]));
  let huntsChanged = 0;
  let mediaChanged = lodgeResult.lodgeMediaChanged;

  for (const hunt of feed.hunts) {
    const previous = existingByListing.get(hunt.listingId);
    if (!previous || previous.content_hash !== hunt.contentHash) huntsChanged += 1;
    const raw = hunt.rawContent as Record<string, any>;
    const v2Fields = feed.schemaVersion === '2.0'
      ? {
          classification: raw.classification,
          duration_and_party: raw.durationAndParty,
          season_and_availability: raw.seasonAndAvailability,
          methods_and_guiding: raw.methodsAndGuiding,
          pricing: raw.pricing,
          accommodations: raw.accommodations,
          territory: raw.territory ?? null,
          travel: raw.travel,
          equipment_and_licenses: raw.equipmentAndLicenses,
          inclusions: raw.inclusions,
          exclusions: raw.exclusions,
          optional_services: raw.optionalServices,
          terms: raw.terms,
          itinerary: raw.itinerary,
          faqs: raw.faqs,
          editorial: raw.editorial,
        }
      : {};
    const { data: stored, error } = await untyped
      .from('marketplace_hunts')
      .upsert(
        {
          source_id: sourceId,
          listing_id: hunt.listingId,
          slug: hunt.slug,
          source_url: hunt.sourceUrl,
          title: hunt.title,
          summary: hunt.summary,
          content_status: hunt.contentStatus,
          trip_type: hunt.tripType,
          primary_species: hunt.primarySpecies,
          secondary_species: hunt.secondarySpecies,
          duration: hunt.duration,
          season: hunt.season,
          starting_price: hunt.startingPrice,
          currency: hunt.currency,
          sections: hunt.sections,
          raw_content: hunt.rawContent,
          content_hash: hunt.contentHash,
          content_updated_at: hunt.contentUpdatedAt,
          source_active: hunt.active,
          last_seen_at: now,
          orphaned_at: null,
          updated_at: now,
          ...v2Fields,
        },
        { onConflict: 'source_id,listing_id' }
      )
      .select('id')
      .single();
    if (error) throw error;
    await syncHuntDestinations(untyped, stored.id, hunt.destinations, now);
    mediaChanged += await syncMedia(supabase, stored.id, hunt, now);
    await syncHuntLodgeRelations(
      untyped,
      stored.id,
      hunt,
      lodgeResult.lodgeRecordsByPublicId,
      now
    );
  }

  const incomingListingIds = new Set(feed.hunts.map((hunt) => hunt.listingId));
  const missingIds = (existingHunts ?? [])
    .filter((hunt) => !incomingListingIds.has(hunt.listing_id) && (hunt.source_active || !hunt.orphaned_at))
    .map((hunt) => hunt.id);
  if (missingIds.length) {
    const { error } = await supabase
      .from('marketplace_hunts')
      .update({ source_active: false, published: false, orphaned_at: now, updated_at: now })
      .in('id', missingIds);
    if (error) throw error;
    huntsChanged += missingIds.length;
  }

  const durationMs = Date.now() - startedAtMs;
  const publicationRevisionId = await recordPublicationRevision(
    untyped,
    sourceId,
    snapshotHash,
    huntsChanged > 0 || mediaChanged > 0 || lodgeResult.lodgesChanged > 0,
    now
  );
  const { error: acceptError } = await supabase
    .from('marketplace_source_snapshots')
    .update({ accepted: true, validation_errors: null })
    .eq('id', snapshot.id);
  if (acceptError) throw acceptError;

  const { error: runError } = await untyped
    .from('marketplace_sync_runs')
    .update({
      status: 'success',
      finished_at: now,
      feed_generated_at: feed.generatedAt,
      hunts_seen: feed.hunts.length,
      hunts_changed: huntsChanged,
      media_changed: mediaChanged,
      lodges_seen: feed.lodges.length,
      lodges_changed: lodgeResult.lodgesChanged,
      accepted_content_hash: snapshotHash,
      publication_revision_id: publicationRevisionId,
      error: null,
    })
    .eq('id', syncRunId);
  if (runError) throw runError;

  const { error: healthError } = await supabase
    .from('marketplace_sources')
    .update({
      last_sync_at: now,
      last_successful_sync_at: now,
      last_sync_status: 'success',
      last_sync_error: null,
      last_sync_duration_ms: durationMs,
      consecutive_failures: 0,
      updated_at: now,
    })
    .eq('source_id', sourceId);
  if (healthError) throw healthError;

  return {
    huntsChanged,
    mediaChanged,
    lodgesChanged: lodgeResult.lodgesChanged,
    durationMs,
  };
}

export async function syncMarketplaceSource(
  sourceId: string,
  trigger: SyncTrigger,
  client = createServiceClient()
): Promise<SyncResult> {
  const startedAtMs = Date.now();
  const { data: source, error: sourceError } = await client
    .from('marketplace_sources')
    .select('*')
    .eq('source_id', sourceId)
    .eq('participation_status', 'active')
    .maybeSingle();
  if (sourceError) throw sourceError;
  if (!source) throw new Error('Marketplace source is unknown or not active');

  const { data: run, error: runError } = await client
    .from('marketplace_sync_runs')
    .insert({ source_id: sourceId, status: 'running', trigger_type: trigger })
    .select('id')
    .single();
  if (runError) throw runError;

  try {
    const feed = await fetchFeed(source.content_feed_url);
    if (feed.source.sourceId !== sourceId) {
      throw new Error(`Feed sourceId does not match registered source ${sourceId}`);
    }
    if (new URL(feed.source.feedUrl).href !== new URL(source.content_feed_url).href) {
      throw new Error('Feed self-declared URL does not match its registered feed URL');
    }
    const result = await ingestFeed(client, feed, sourceId, run.id, startedAtMs);
    return {
      sourceId,
      status: 'success',
      huntsSeen: feed.hunts.length,
      huntsChanged: result.huntsChanged,
      mediaChanged: result.mediaChanged,
      lodgesSeen: feed.lodges.length,
      lodgesChanged: result.lodgesChanged,
      durationMs: result.durationMs,
    };
  } catch (error) {
    const message = errorMessage(error);
    const now = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    await client.from('marketplace_sync_runs').update({
      status: 'failed',
      finished_at: now,
      error: message,
    }).eq('id', run.id);
    await client.from('marketplace_sync_errors').insert({
      sync_run_id: run.id,
      source_id: sourceId,
      error_code: 'SOURCE_SYNC_FAILED',
      message,
    });
    await client.from('marketplace_sources').update({
      last_sync_at: now,
      last_sync_status: 'failed',
      last_sync_error: message,
      last_sync_duration_ms: durationMs,
      consecutive_failures: source.consecutive_failures + 1,
      updated_at: now,
    }).eq('source_id', sourceId);
    return {
      sourceId,
      status: 'failed',
      huntsSeen: 0,
      huntsChanged: 0,
      mediaChanged: 0,
      lodgesSeen: 0,
      lodgesChanged: 0,
      durationMs,
      error: message,
    };
  }
}

export async function syncAllMarketplaceSources(trigger: SyncTrigger = 'scheduled') {
  const client = createServiceClient();
  const { data: sources, error } = await client
    .from('marketplace_sources')
    .select('source_id')
    .eq('participation_status', 'active')
    .order('source_id');
  if (error) throw error;

  const results: SyncResult[] = [];
  for (const source of sources ?? []) {
    results.push(await syncMarketplaceSource(source.source_id, trigger, client));
  }
  return results;
}
