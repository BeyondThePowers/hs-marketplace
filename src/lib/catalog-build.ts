import { createHash } from 'node:crypto';
import type { Database } from './database.types';
import { createPublicClient } from './supabase-server';

type ViewRow<Name extends keyof Database['public']['Views']> =
  Database['public']['Views'][Name]['Row'];

export type CatalogHunt = ViewRow<'marketplace_public_hunts'>;
export type CatalogHuntMedia = ViewRow<'marketplace_public_hunt_media'>;
export type CatalogOutfitter = ViewRow<'marketplace_public_outfitters'>;
export type CatalogLodge = ViewRow<'marketplace_public_lodges'>;
export type CatalogHuntLodge = ViewRow<'marketplace_public_hunt_lodges'>;
export type CatalogLodgeMedia = ViewRow<'marketplace_public_lodge_media'>;

export type CatalogSnapshot = {
  revision: string;
  generatedAt: string;
  publicationRevision: {
    id: string;
    revisionHash: string;
    acceptedAt: string;
  } | null;
  hunts: CatalogHunt[];
  huntMedia: CatalogHuntMedia[];
  outfitters: CatalogOutfitter[];
  lodges: CatalogLodge[];
  huntLodges: CatalogHuntLodge[];
  lodgeMedia: CatalogLodgeMedia[];
};

let snapshotPromise: Promise<CatalogSnapshot> | undefined;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function queryCatalog(): Promise<CatalogSnapshot> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('marketplace_get_public_catalog');
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Public catalog snapshot returned an invalid payload');
  }
  const value = data as Record<string, unknown>;
  const rawPublicationRevision = value.publicationRevision;
  const publicationRevision = rawPublicationRevision && typeof rawPublicationRevision === 'object' && !Array.isArray(rawPublicationRevision)
    ? rawPublicationRevision as Record<string, unknown>
    : null;
  const content = {
    hunts: (Array.isArray(value.hunts) ? value.hunts : []) as CatalogHunt[],
    huntMedia: (Array.isArray(value.huntMedia) ? value.huntMedia : []) as CatalogHuntMedia[],
    outfitters: (Array.isArray(value.outfitters) ? value.outfitters : []) as CatalogOutfitter[],
    lodges: (Array.isArray(value.lodges) ? value.lodges : []) as CatalogLodge[],
    huntLodges: (Array.isArray(value.huntLodges) ? value.huntLodges : []) as CatalogHuntLodge[],
    lodgeMedia: (Array.isArray(value.lodgeMedia) ? value.lodgeMedia : []) as CatalogLodgeMedia[],
  };
  const revision = `sha256:${createHash('sha256').update(stableJson(content)).digest('hex')}`;

  return {
    revision,
    generatedAt: new Date().toISOString(),
    publicationRevision: publicationRevision &&
      typeof publicationRevision.id === 'string' &&
      typeof publicationRevision.revisionHash === 'string' &&
      typeof publicationRevision.acceptedAt === 'string'
      ? {
          id: publicationRevision.id,
          revisionHash: publicationRevision.revisionHash,
          acceptedAt: publicationRevision.acceptedAt,
        }
      : null,
    ...content,
  };
}

/** One immutable public catalog snapshot is shared by every route in a build. */
export function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  snapshotPromise ??= queryCatalog();
  return snapshotPromise;
}

export function mediaUrl(media: CatalogHuntMedia | CatalogLodgeMedia | undefined) {
  return media?.mirrored_url || media?.source_url || null;
}
