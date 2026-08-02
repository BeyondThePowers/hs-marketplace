import type { Json } from './database.types';
import type { MarketplaceAnyContentFeed, MarketplaceContentFeed } from './marketplace-content-schema';
import type { MarketplaceContentFeedV2 } from './content-contract-v2';

export type NormalizedMedia = {
  url: string;
  alt: string;
  caption?: string | null;
  role: string;
  sortOrder: number;
};

export type NormalizedHunt = {
  listingId: string;
  slug: string;
  sourceUrl: string;
  title: string;
  summary: string;
  contentStatus: 'draft' | 'ready';
  contentUpdatedAt: string;
  active: boolean;
  tripType: string;
  primarySpecies: string[];
  secondarySpecies: string[];
  country: string;
  region: string;
  duration: Json;
  season: Json;
  startingPrice: number;
  currency: string;
  sections: Json[];
  media: NormalizedMedia[];
  rawContent: Json;
  contentHash: string;
};

export type NormalizedFeed = {
  schemaVersion: string;
  generatedAt: string;
  source: MarketplaceAnyContentFeed['source'];
  outfitter: {
    name: string;
    tagline: string;
    summary: string;
    profileUrl: string;
    inquiryUrl: string;
    logo: Json;
    profileImage: Json;
    countries: string[];
    regions: string[];
    founded?: number;
    headquarters?: string;
    contact: Json | null;
    social: string[];
    inquiry: Json;
    rawContent: Json;
  };
  dataPolicy: Json;
  hunts: NormalizedHunt[];
  lodges: MarketplaceContentFeedV2['lodges'];
  rawFeed: MarketplaceAnyContentFeed;
};

function isV2(feed: MarketplaceAnyContentFeed): feed is MarketplaceContentFeedV2 {
  return feed.schemaVersion === '2.0';
}

function v2Sections(hunt: MarketplaceContentFeedV2['hunts'][number]): Json[] {
  return [
    { type: 'overview', heading: 'Overview', body: hunt.editorial.description },
    { type: 'highlights', heading: 'Highlights', items: hunt.editorial.highlights },
    { type: 'hunting', heading: 'Hunting approach', ...hunt.methodsAndGuiding },
    { type: 'inclusions', heading: 'Included', items: hunt.inclusions },
    { type: 'exclusions', heading: 'Not included', items: hunt.exclusions },
    { type: 'optionalServices', heading: 'Optional services', services: hunt.optionalServices },
    { type: 'itinerary', heading: 'Itinerary', days: hunt.itinerary },
    { type: 'travel', heading: 'Travel', ...hunt.travel },
    { type: 'equipment', heading: 'Equipment and licenses', ...hunt.equipmentAndLicenses },
    { type: 'terms', heading: 'Terms', ...hunt.terms, ...hunt.pricing },
    { type: 'faq', heading: 'Frequently asked questions', items: hunt.faqs },
    ...hunt.editorial.extraSections,
  ] as Json[];
}

function normalizeV1(feed: MarketplaceContentFeed): NormalizedFeed {
  return {
    schemaVersion: feed.schemaVersion,
    generatedAt: feed.generatedAt,
    source: feed.source,
    outfitter: {
      ...feed.outfitter,
      logo: feed.outfitter.logo as Json,
      profileImage: feed.outfitter.profileImage as Json,
      contact: feed.outfitter.contact as Json,
      inquiry: { mode: 'source-page', inquiryPageUrl: feed.outfitter.inquiryUrl },
      rawContent: feed.outfitter as unknown as Json,
    },
    dataPolicy: feed.dataPolicy as unknown as Json,
    hunts: feed.hunts.map((hunt) => ({
      ...hunt,
      duration: hunt.duration as Json,
      season: hunt.season as Json,
      sections: hunt.sections as unknown as Json[],
      media: [hunt.featuredImage, ...hunt.gallery],
      rawContent: hunt as unknown as Json,
    })),
    lodges: [],
    rawFeed: feed,
  };
}

function normalizeV2(feed: MarketplaceContentFeedV2): NormalizedFeed {
  return {
    schemaVersion: feed.schemaVersion,
    generatedAt: feed.generatedAt,
    source: feed.source,
    outfitter: {
      name: feed.outfitter.name,
      tagline: feed.outfitter.tagline,
      summary: feed.outfitter.summary,
      profileUrl: feed.outfitter.profileUrl,
      inquiryUrl: feed.outfitter.inquiry.inquiryPageUrl,
      logo: feed.outfitter.logo as unknown as Json,
      profileImage: feed.outfitter.profileImage as unknown as Json,
      countries: feed.outfitter.countries.map((country) => country.name),
      regions: feed.outfitter.regions.map((region) => region.name),
      founded: feed.outfitter.founded,
      headquarters: feed.outfitter.headquarters,
      contact: feed.outfitter.contact as unknown as Json,
      social: feed.outfitter.social,
      inquiry: feed.outfitter.inquiry as unknown as Json,
      rawContent: feed.outfitter as unknown as Json,
    },
    dataPolicy: feed.dataPolicy as unknown as Json,
    hunts: feed.hunts.map((hunt) => {
      const price = hunt.pricing.options[0];
      return {
        listingId: hunt.listingId,
        slug: hunt.slug,
        sourceUrl: hunt.sourceUrl,
        title: hunt.title,
        summary: hunt.summary,
        contentStatus: hunt.contentStatus,
        contentUpdatedAt: hunt.contentUpdatedAt,
        active: hunt.active,
        tripType: hunt.classification.tripType,
        primarySpecies: hunt.classification.primarySpecies.map((species) => species.name),
        secondarySpecies: hunt.classification.secondarySpecies.map((species) => species.name),
        country: hunt.location.country.name,
        region: hunt.location.region.name,
        duration: hunt.durationAndParty as unknown as Json,
        season: hunt.seasonAndAvailability as unknown as Json,
        startingPrice: price.amount,
        currency: price.currency,
        sections: v2Sections(hunt),
        media: hunt.media,
        rawContent: hunt as unknown as Json,
        contentHash: hunt.contentHash,
      };
    }),
    lodges: feed.lodges,
    rawFeed: feed,
  };
}

export function normalizeMarketplaceFeed(feed: MarketplaceAnyContentFeed): NormalizedFeed {
  return isV2(feed) ? normalizeV2(feed) : normalizeV1(feed);
}
