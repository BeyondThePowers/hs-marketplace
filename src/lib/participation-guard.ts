import { getStore } from '@netlify/blobs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase-server';

export const PARTICIPATION_STORE = 'marketplace-participation';
export const PARTICIPATION_KEY = 'current';

export type ParticipationManifest = {
  schemaVersion: '1.0';
  generatedAt: string;
  sources: Record<string, boolean>;
  hunts: Record<string, string>;
  outfitters: Record<string, string>;
  lodges: Record<string, string>;
};

type UntypedClient = SupabaseClient<any>;

export async function buildParticipationManifest(
  client: UntypedClient = createServiceClient() as UntypedClient
): Promise<ParticipationManifest> {
  const [sourcesResult, huntsResult, outfittersResult, lodgesResult] = await Promise.all([
    client.from('marketplace_sources').select('source_id, participation_status, feed_enabled'),
    client.from('marketplace_hunts').select('source_id, listing_id'),
    client.from('marketplace_outfitters').select('source_id, public_id'),
    client.from('marketplace_lodges').select('source_id, lodge_id'),
  ]);
  for (const result of [sourcesResult, huntsResult, outfittersResult, lodgesResult]) {
    if (result.error) throw result.error;
  }

  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    sources: Object.fromEntries((sourcesResult.data ?? []).map((source: any) => [
      source.source_id,
      source.participation_status === 'active' && source.feed_enabled === true,
    ])),
    hunts: Object.fromEntries((huntsResult.data ?? []).map((hunt: any) => [hunt.listing_id, hunt.source_id])),
    outfitters: Object.fromEntries((outfittersResult.data ?? []).map((outfitter: any) => [outfitter.public_id, outfitter.source_id])),
    lodges: Object.fromEntries((lodgesResult.data ?? []).map((lodge: any) => [lodge.lodge_id, lodge.source_id])),
  };
}

export async function refreshParticipationManifest(
  client: UntypedClient = createServiceClient() as UntypedClient
) {
  const manifest = await buildParticipationManifest(client);
  const store = getStore(PARTICIPATION_STORE);
  const result = await store.setJSON(PARTICIPATION_KEY, manifest);
  return { manifest, etag: result.etag };
}
