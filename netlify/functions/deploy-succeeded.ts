import type { Handler } from '@netlify/functions';
import { verifyPublicationDeployment } from '../../src/lib/publication-build';

export const handler: Handler = async (event) => {
  const envelope = JSON.parse(event.body || '{}') as Record<string, unknown>;
  const payload = envelope.payload && typeof envelope.payload === 'object' && !Array.isArray(envelope.payload)
    ? envelope.payload as Record<string, unknown>
    : envelope;
  if (payload.context && payload.context !== 'production') {
    return { statusCode: 200, body: 'Non-production deployment ignored' };
  }

  const deploymentId = typeof payload.id === 'string' ? payload.id : '';
  const deploymentUrl = [payload.deploy_ssl_url, payload.ssl_url, payload.deploy_url, payload.url]
    .find((value): value is string => typeof value === 'string' && value.startsWith('http'));
  if (!deploymentId || !deploymentUrl) {
    console.error('[marketplace-publication] Deployment event is missing identity', payload);
    return { statusCode: 400, body: 'Deployment identity is required' };
  }

  try {
    const result = await verifyPublicationDeployment(deploymentId, deploymentUrl);
    console.log('[marketplace-publication] Deployment verified', result);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error('[marketplace-publication] Deployment verification failed', error);
    return { statusCode: 500, body: error instanceof Error ? error.message : 'Deployment verification failed' };
  }
};
