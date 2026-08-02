import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase-server';

type UntypedClient = SupabaseClient<any>;

type BuildClaim = {
  revision_id: string;
  revision_hash: string;
};

type PublicCatalogMarker = {
  publicationRevision?: {
    id?: unknown;
    revisionHash?: unknown;
    acceptedAt?: unknown;
  } | null;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown publication error';
}

export async function requestPendingPublicationBuild(
  client: UntypedClient = createServiceClient() as UntypedClient
) {
  const buildHookUrl = process.env.MARKETPLACE_BUILD_HOOK_URL;
  if (!buildHookUrl) {
    return { status: 'disabled' as const, reason: 'MARKETPLACE_BUILD_HOOK_URL is not configured' };
  }

  const { data, error } = await client.rpc('marketplace_claim_publication_build', {
    minimum_age_seconds: 30,
    stale_after_minutes: 30,
  });
  if (error) throw error;

  const claim = (Array.isArray(data) ? data[0] : null) as BuildClaim | undefined;
  if (!claim) return { status: 'idle' as const };

  try {
    const response = await fetch(buildHookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger_title: `Marketplace publication ${claim.revision_hash.slice(0, 12)}`,
        clear_cache: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Netlify build hook returned HTTP ${response.status}`);
    return {
      status: 'requested' as const,
      revisionId: claim.revision_id,
      revisionHash: claim.revision_hash,
    };
  } catch (error) {
    await client.rpc('marketplace_fail_publication_build', {
      target_revision_id: claim.revision_id,
      failure_message: errorMessage(error),
    });
    throw error;
  }
}

async function fetchCatalogMarker(deploymentUrl: string): Promise<PublicCatalogMarker> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(new URL('/catalog-index.json', deploymentUrl), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Catalog marker returned HTTP ${response.status}`);
      return await response.json() as PublicCatalogMarker;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1_500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function verifyPublicationDeployment(
  deploymentId: string,
  deploymentUrl: string,
  client: UntypedClient = createServiceClient() as UntypedClient
) {
  const marker = await fetchCatalogMarker(deploymentUrl);
  const revision = marker.publicationRevision;
  if (!revision || typeof revision.id !== 'string' || typeof revision.revisionHash !== 'string') {
    throw new Error('Deployment does not expose a valid publication revision');
  }

  const { data, error } = await client.rpc('marketplace_verify_publication_build', {
    target_revision_id: revision.id,
    target_revision_hash: revision.revisionHash,
    target_deployment_id: deploymentId,
    target_deployment_url: deploymentUrl,
  });
  if (error) throw error;
  if (data !== true) throw new Error('Deployment publication revision is not registered');

  return {
    revisionId: revision.id,
    revisionHash: revision.revisionHash,
    deploymentId,
    deploymentUrl,
  };
}

export async function failCurrentPublicationBuild(
  failureMessage: string,
  client: UntypedClient = createServiceClient() as UntypedClient
) {
  const { data, error } = await client
    .from('marketplace_publication_revisions')
    .select('id')
    .in('build_status', ['requested', 'building'])
    .order('build_requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) return false;

  const { error: failError } = await client.rpc('marketplace_fail_publication_build', {
    target_revision_id: data.id,
    failure_message: failureMessage,
  });
  if (failError) throw failError;
  return true;
}
