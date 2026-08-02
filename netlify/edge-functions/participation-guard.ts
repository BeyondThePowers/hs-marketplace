import { getStore } from '@netlify/blobs';
import fallbackManifest from './generated/participation-manifest.json' with { type: 'json' };

type Manifest = typeof fallbackManifest;

let cachedManifest: Manifest | null = null;
let cacheExpiresAt = 0;

async function manifest() {
  if (cachedManifest && Date.now() < cacheExpiresAt) return cachedManifest;
  try {
    const store = getStore('marketplace-participation');
    cachedManifest = await store.get('current', { consistency: 'strong', type: 'json' }) as Manifest | null;
    cachedManifest ??= fallbackManifest;
    cacheExpiresAt = Date.now() + 10_000;
    return cachedManifest;
  } catch (error) {
    console.error('[marketplace-participation] Guard manifest unavailable', error);
    throw error;
  }
}

function sourceForPath(pathname: string, data: Manifest) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  if (parts[0] === 'hunts') return data.hunts[parts[1]] ?? null;
  if (parts[0] === 'outfitters') return data.outfitters[parts[1]] ?? null;
  if (parts[0] === 'lodges') return data.lodges[parts[1]] ?? null;
  return null;
}

function unavailable() {
  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Listing unavailable</title></head><body><main><h1>Listing unavailable</h1><p>This listing is not currently participating in the marketplace.</p><p><a href="/">Browse available hunts</a></p></main></body></html>',
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}

export default async (request: Request, context: { next(): Promise<Response> }) => {
  const data = await manifest().catch(() => null);
  if (!data) return new Response('Marketplace participation status is temporarily unavailable', { status: 503 });

  const pathname = new URL(request.url).pathname;
  const sourceId = sourceForPath(pathname, data);
  if (sourceId && data.sources[sourceId] !== true) return unavailable();

  const response = await context.next();
  const inactiveSources = Object.entries(data.sources).filter(([, active]) => !active).map(([id]) => id);
  if (inactiveSources.length === 0) return response;

  if (pathname === '/catalog-index.json' && response.ok) {
    const catalog = await response.json();
    catalog.hunts = Array.isArray(catalog.hunts)
      ? catalog.hunts.filter((hunt: { sourceId?: string }) => hunt.sourceId && data.sources[hunt.sourceId] === true)
      : [];
    return Response.json(catalog, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (pathname === '/' && response.ok) {
    const html = await response.text();
    const selectors = inactiveSources.map((id) => `[data-marketplace-source="${id}"]`).join(',');
    const guard = `<style>${selectors}{display:none!important}</style><script>window.__MARKETPLACE_INACTIVE_SOURCES__=${JSON.stringify(inactiveSources)}</script>`;
    return new Response(html.replace('</head>', `${guard}</head>`), {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), 'Cache-Control': 'no-store' },
    });
  }

  return response;
};

export const config = {
  path: ['/', '/catalog-index.json', '/hunts/*', '/outfitters/*', '/lodges/*'],
};
