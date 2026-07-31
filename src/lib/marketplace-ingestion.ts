import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';
import { contentHash } from './content-hash';
import { MarketplaceContentFeedSchema, type MarketplaceContentFeed } from './marketplace-content-schema';
import { assertSafeFeedUrl } from './source-security';
import { createServiceClient } from './supabase-server';

export type SyncTrigger = 'webhook' | 'scheduled' | 'manual';

export type SyncResult = {
  sourceId: string;
  status: 'success' | 'failed';
  huntsSeen: number;
  huntsChanged: number;
  mediaChanged: number;
  durationMs: number;
  error?: string;
};

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
  return MarketplaceContentFeedSchema.parse(await response.json());
}

async function syncMedia(
  supabase: SupabaseClient<Database>,
  huntId: string,
  feed: MarketplaceContentFeed['hunts'][number],
  now: string
) {
  const incoming = [feed.featuredImage, ...feed.gallery];
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

async function ingestFeed(
  supabase: SupabaseClient<Database>,
  feed: MarketplaceContentFeed,
  sourceId: string,
  syncRunId: string,
  startedAtMs: number
) {
  const now = new Date().toISOString();
  const snapshotHash = contentHash({ ...feed, generatedAt: undefined });
  const { data: snapshot, error: snapshotError } = await supabase
    .from('marketplace_source_snapshots')
    .upsert(
      {
        source_id: sourceId,
        schema_version: feed.schemaVersion,
        content_hash: snapshotHash,
        payload: feed as unknown as Json,
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
    logo: feed.outfitter.logo as Json,
    profile_image: feed.outfitter.profileImage as Json,
    countries: feed.outfitter.countries,
    regions: feed.outfitter.regions,
    founded: feed.outfitter.founded ?? null,
    headquarters: feed.outfitter.headquarters ?? null,
    public_contact: feed.outfitter.contact as Json,
    social_urls: feed.outfitter.social,
    content_hash: contentHash(feed.outfitter),
    content_updated_at: feed.generatedAt,
    updated_at: now,
  };
  const { error: outfitterError } = await supabase
    .from('marketplace_outfitters')
    .upsert(outfitterPayload, { onConflict: 'source_id' });
  if (outfitterError) throw outfitterError;

  const { data: existingHunts, error: existingHuntsError } = await supabase
    .from('marketplace_hunts')
    .select('id, listing_id, content_hash, central_moderation_status')
    .eq('source_id', sourceId);
  if (existingHuntsError) throw existingHuntsError;
  const existingByListing = new Map((existingHunts ?? []).map((hunt) => [hunt.listing_id, hunt]));
  let huntsChanged = 0;
  let mediaChanged = 0;

  for (const hunt of feed.hunts) {
    const previous = existingByListing.get(hunt.listingId);
    if (!previous || previous.content_hash !== hunt.contentHash) huntsChanged += 1;
    const published = Boolean(
      feed.source.enabled &&
      hunt.active &&
      hunt.contentStatus === 'ready' &&
      previous?.central_moderation_status === 'approved'
    );
    const { data: stored, error } = await supabase
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
          country: hunt.country,
          region: hunt.region,
          duration: hunt.duration as Json,
          season: hunt.season as Json,
          starting_price: hunt.startingPrice,
          currency: hunt.currency,
          sections: hunt.sections as Json,
          raw_content: hunt as unknown as Json,
          content_hash: hunt.contentHash,
          content_updated_at: hunt.contentUpdatedAt,
          source_active: hunt.active,
          published,
          last_seen_at: now,
          orphaned_at: null,
          updated_at: now,
        },
        { onConflict: 'source_id,listing_id' }
      )
      .select('id')
      .single();
    if (error) throw error;
    mediaChanged += await syncMedia(supabase, stored.id, hunt, now);
  }

  const incomingListingIds = new Set(feed.hunts.map((hunt) => hunt.listingId));
  const missingIds = (existingHunts ?? [])
    .filter((hunt) => !incomingListingIds.has(hunt.listing_id))
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
  const { error: acceptError } = await supabase
    .from('marketplace_source_snapshots')
    .update({ accepted: true, validation_errors: null })
    .eq('id', snapshot.id);
  if (acceptError) throw acceptError;

  const { error: runError } = await supabase
    .from('marketplace_sync_runs')
    .update({
      status: 'success',
      finished_at: now,
      feed_generated_at: feed.generatedAt,
      hunts_seen: feed.hunts.length,
      hunts_changed: huntsChanged,
      media_changed: mediaChanged,
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

  return { huntsChanged, mediaChanged, durationMs };
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
    .eq('enabled', true)
    .maybeSingle();
  if (sourceError) throw sourceError;
  if (!source) throw new Error('Marketplace source is unknown or disabled');

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
    .eq('enabled', true)
    .order('source_id');
  if (error) throw error;

  const results: SyncResult[] = [];
  for (const source of sources ?? []) {
    results.push(await syncMarketplaceSource(source.source_id, trigger, client));
  }
  return results;
}
