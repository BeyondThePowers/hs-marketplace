import type { Handler } from '@netlify/functions';
import { failCurrentPublicationBuild } from '../../src/lib/publication-build';

export const handler: Handler = async (event) => {
  const envelope = JSON.parse(event.body || '{}') as Record<string, unknown>;
  const payload = envelope.payload && typeof envelope.payload === 'object' && !Array.isArray(envelope.payload)
    ? envelope.payload as Record<string, unknown>
    : envelope;
  if (payload.context && payload.context !== 'production') {
    return { statusCode: 200, body: 'Non-production deployment ignored' };
  }

  const deploymentId = typeof payload.id === 'string' ? payload.id : 'unknown';
  const message = typeof payload.error_message === 'string' && payload.error_message
    ? payload.error_message
    : `Netlify deployment ${deploymentId} failed`;
  try {
    const marked = await failCurrentPublicationBuild(message);
    console.log('[marketplace-publication] Failed deployment recorded', { deploymentId, marked });
    return { statusCode: 200, body: JSON.stringify({ deploymentId, marked }) };
  } catch (error) {
    console.error('[marketplace-publication] Failed deployment could not be recorded', error);
    return { statusCode: 500, body: error instanceof Error ? error.message : 'Unable to record failed deployment' };
  }
};
