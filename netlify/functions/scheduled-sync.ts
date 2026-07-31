import type { Handler } from '@netlify/functions';
import { syncAllMarketplaceSources } from '../../src/lib/marketplace-ingestion';

export const handler: Handler = async () => {
  const results = await syncAllMarketplaceSources('scheduled');
  const failed = results.filter((result) => result.status === 'failed').length;

  console.log('[marketplace-sync] Scheduled reconciliation complete', {
    sources: results.length,
    failed,
  });

  return {
    statusCode: failed ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources: results.length, failed, results }),
  };
};
