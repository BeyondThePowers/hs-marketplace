import type { Handler } from '@netlify/functions';
import { requestPendingPublicationBuild } from '../../src/lib/publication-build';

export const handler: Handler = async () => {
  try {
    const result = await requestPendingPublicationBuild();
    console.log('[marketplace-publication] Scheduled build check complete', result);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[marketplace-publication] Build request failed', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Build request failed' }),
    };
  }
};
