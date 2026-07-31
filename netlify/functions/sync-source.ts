import type { Handler } from '@netlify/functions';
import { syncMarketplaceSource } from '../../src/lib/marketplace-ingestion';
import { bearerToken, verifySecret } from '../../src/lib/source-security';
import { createServiceClient } from '../../src/lib/supabase-server';

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const sourceId = event.headers['x-marketplace-source-id']?.trim();
  const token = bearerToken(event.headers.authorization);
  if (!sourceId || !token) {
    return json(401, { error: 'Source credentials are required' });
  }

  const supabase = createServiceClient();
  const { data: source, error } = await supabase
    .from('marketplace_sources')
    .select('source_id, enabled, webhook_secret_hash')
    .eq('source_id', sourceId)
    .maybeSingle();

  if (error) {
    console.error('[marketplace-sync] Source authentication lookup failed', error);
    return json(503, { error: 'Synchronization authentication is unavailable' });
  }
  if (!source?.enabled || !source.webhook_secret_hash) {
    return json(401, { error: 'Invalid source credentials' });
  }
  if (!verifySecret(token, source.webhook_secret_hash)) {
    return json(401, { error: 'Invalid source credentials' });
  }

  await supabase
    .from('marketplace_sources')
    .update({ last_webhook_at: new Date().toISOString() })
    .eq('source_id', sourceId);

  const result = await syncMarketplaceSource(sourceId, 'webhook', supabase);
  return json(result.status === 'success' ? 200 : 502, result);
};
