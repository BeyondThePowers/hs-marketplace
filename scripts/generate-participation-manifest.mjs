import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const [sourcesResult, huntsResult, outfittersResult, lodgesResult] = await Promise.all([
  client.from('marketplace_sources').select('source_id, participation_status, feed_enabled'),
  client.from('marketplace_hunts').select('source_id, listing_id'),
  client.from('marketplace_outfitters').select('source_id, public_id'),
  client.from('marketplace_lodges').select('source_id, lodge_id'),
]);
for (const result of [sourcesResult, huntsResult, outfittersResult, lodgesResult]) {
  if (result.error) throw result.error;
}

const manifest = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  sources: Object.fromEntries((sourcesResult.data ?? []).map((source) => [
    source.source_id,
    source.participation_status === 'active' && source.feed_enabled === true,
  ])),
  hunts: Object.fromEntries((huntsResult.data ?? []).map((hunt) => [hunt.listing_id, hunt.source_id])),
  outfitters: Object.fromEntries((outfittersResult.data ?? []).map((outfitter) => [outfitter.public_id, outfitter.source_id])),
  lodges: Object.fromEntries((lodgesResult.data ?? []).map((lodge) => [lodge.lodge_id, lodge.source_id])),
};

const outputDirectory = new URL('../netlify/edge-functions/generated/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL('participation-manifest.json', outputDirectory), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated participation guard for ${Object.keys(manifest.sources).length} sources.`);
