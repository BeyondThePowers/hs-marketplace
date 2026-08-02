import type { Handler } from '@netlify/functions';
import { refreshParticipationManifest } from '../../src/lib/participation-guard';

export const handler: Handler = async () => {
  try {
    const { manifest, etag } = await refreshParticipationManifest();
    console.log('[marketplace-participation] Guard manifest refreshed', {
      generatedAt: manifest.generatedAt,
      sources: Object.keys(manifest.sources).length,
      etag,
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generatedAt: manifest.generatedAt, sources: Object.keys(manifest.sources).length }),
    };
  } catch (error) {
    console.error('[marketplace-participation] Guard manifest refresh failed', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Guard refresh failed' }),
    };
  }
};
