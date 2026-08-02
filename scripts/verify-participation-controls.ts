import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/database.types';
import { createServiceClient } from '../src/lib/supabase-server';

const sourceId = '11111111-1111-4111-8111-111111111111';
const listingId = '22222222-2222-4222-8222-222222222222';
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const service = createServiceClient();
const publicClient = createClient<Database>(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function cleanup() {
  const { error } = await service.from('marketplace_sources').delete().eq('source_id', sourceId);
  if (error) throw error;
}

async function publicCount(view: 'marketplace_public_hunts' | 'marketplace_public_outfitters') {
  const { count, error } = await publicClient
    .from(view)
    .select('*', { count: 'exact', head: true })
    .eq('source_id', sourceId);
  if (error) throw error;
  return count ?? 0;
}

async function storedPublication() {
  const [{ data: hunt, error: huntError }, { data: outfitter, error: outfitterError }] = await Promise.all([
    service.from('marketplace_hunts').select('published').eq('source_id', sourceId).single(),
    service.from('marketplace_outfitters').select('published').eq('source_id', sourceId).single(),
  ]);
  if (huntError) throw huntError;
  if (outfitterError) throw outfitterError;
  return { hunt: hunt.published, outfitter: outfitter.published };
}

try {
  await cleanup();

  const { error: sourceError } = await service.from('marketplace_sources').insert({
    source_id: sourceId,
    name: 'Participation Control Test',
    content_feed_url: 'https://example.com/marketplace-feed.json',
    source_url: 'https://example.com',
    participation_status: 'pending',
    feed_enabled: true,
  });
  if (sourceError) throw sourceError;

  const { error: outfitterError } = await service.from('marketplace_outfitters').insert({
    source_id: sourceId,
    name: 'Participation Control Test',
    tagline: 'Synthetic verification record',
    summary: 'Synthetic record used to verify marketplace participation controls.',
    profile_url: 'https://example.com/about',
    inquiry_url: 'https://example.com/contact',
    logo: { url: 'https://example.com/logo.png', alt: 'Test' },
    profile_image: { url: 'https://example.com/profile.png', alt: 'Test' },
    countries: ['Test'],
    regions: ['Test'],
    social_urls: [],
    content_hash: 'participation-control-test',
    content_updated_at: new Date().toISOString(),
    central_moderation_status: 'approved',
  });
  if (outfitterError) throw outfitterError;

  const { error: huntError } = await service.from('marketplace_hunts').insert({
    source_id: sourceId,
    listing_id: listingId,
    slug: 'participation-control-test',
    source_url: 'https://example.com/hunts/participation-control-test',
    title: 'Participation Control Test',
    summary: 'Synthetic record used to verify marketplace participation controls.',
    content_status: 'ready',
    central_moderation_status: 'approved',
    trip_type: 'Test',
    primary_species: ['Test'],
    secondary_species: [],
    country: 'Test',
    region: 'Test',
    duration: {},
    season: {},
    starting_price: 1,
    currency: 'USD',
    sections: [],
    content_hash: 'participation-control-test',
    content_updated_at: new Date().toISOString(),
    source_active: true,
  });
  if (huntError) throw huntError;

  const pending = {
    stored: await storedPublication(),
    publicHunts: await publicCount('marketplace_public_hunts'),
    publicOutfitters: await publicCount('marketplace_public_outfitters'),
  };

  const { error: activateError } = await service.rpc('set_marketplace_source_participation', {
    target_source_id: sourceId,
    new_status: 'active',
    recorded_by: 'automated-participation-verification',
    reason: 'Disposable integration check',
  });
  if (activateError) throw activateError;

  const active = {
    stored: await storedPublication(),
    publicHunts: await publicCount('marketplace_public_hunts'),
    publicOutfitters: await publicCount('marketplace_public_outfitters'),
  };

  const { error: pauseError } = await service.rpc('set_marketplace_source_participation', {
    target_source_id: sourceId,
    new_status: 'paused',
    recorded_by: 'automated-participation-verification',
    reason: 'Disposable integration check complete',
  });
  if (pauseError) throw pauseError;

  const paused = {
    stored: await storedPublication(),
    publicHunts: await publicCount('marketplace_public_hunts'),
    publicOutfitters: await publicCount('marketplace_public_outfitters'),
  };

  const passed =
    pending.stored.hunt === false &&
    pending.stored.outfitter === false &&
    pending.publicHunts === 0 &&
    pending.publicOutfitters === 0 &&
    active.stored.hunt === true &&
    active.stored.outfitter === true &&
    active.publicHunts === 1 &&
    active.publicOutfitters === 1 &&
    paused.stored.hunt === false &&
    paused.stored.outfitter === false &&
    paused.publicHunts === 0 &&
    paused.publicOutfitters === 0;

  console.log(JSON.stringify({ passed, pending, active, paused }, null, 2));
  if (!passed) process.exitCode = 1;
} finally {
  await cleanup();
}
