import { z } from 'zod';
import { MarketplaceContentFeedV2Schema } from './content-contract-v2.ts';

export const MarketplaceMediaSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
  caption: z.string().nullable().optional(),
  role: z.enum(['featured', 'gallery', 'section', 'outfitter-logo']).default('gallery'),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const MarketplaceSectionSchema = z
  .object({
    type: z.string().min(1),
    heading: z.string().optional(),
    body: z.string().optional(),
  })
  .passthrough();

export const MarketplaceSourceSchema = z.object({
  sourceId: z.string().uuid(),
  sourceUrl: z.string().url(),
  feedUrl: z.string().url(),
  language: z.string().min(2),
  enabled: z.boolean(),
});

export const MarketplaceOutfitterSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  summary: z.string().min(1),
  profileUrl: z.string().url(),
  inquiryUrl: z.string().url(),
  logo: MarketplaceMediaSchema.pick({ url: true, alt: true }),
  profileImage: MarketplaceMediaSchema.pick({ url: true, alt: true }),
  countries: z.array(z.string().min(1)).min(1),
  regions: z.array(z.string().min(1)).default([]),
  founded: z.number().int().positive().optional(),
  headquarters: z.string().min(1).optional(),
  contact: z
    .object({
      email: z.string().email(),
      phone: z.string().min(1),
      whatsapp: z.string().min(1).optional(),
    })
    .nullable(),
  social: z.array(z.string().url()).default([]),
});

export const MarketplaceDataPolicySchema = z.object({
  pricing: z.literal('starting-prices-subject-to-confirmation'),
  availability: z.literal('inquiry-only'),
  contentUse: z.literal('public-factual-syndication'),
});

export const MarketplaceHuntContentSchema = z.object({
  listingId: z.string().uuid(),
  slug: z.string().min(1),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentStatus: z.enum(['draft', 'ready']),
  contentUpdatedAt: z.string().datetime(),
  active: z.boolean(),
  tripType: z.string().min(1),
  primarySpecies: z.array(z.string().min(1)).min(1),
  secondarySpecies: z.array(z.string().min(1)).default([]),
  country: z.string().min(1),
  region: z.string().min(1),
  duration: z.object({
    nights: z.number().int().nonnegative().optional(),
    huntingDays: z.number().int().nonnegative().optional(),
    display: z.string().min(1),
  }),
  season: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    display: z.string().min(1),
    peak: z.string().optional(),
  }),
  startingPrice: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  pricingStructure: z.string().optional(),
  featuredImage: MarketplaceMediaSchema,
  gallery: z.array(MarketplaceMediaSchema).default([]),
  sections: z.array(MarketplaceSectionSchema).default([]),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
});

export const MarketplaceContentFeedSchema = z.object({
  schemaVersion: z.literal('1.0'),
  generatedAt: z.string().datetime(),
  source: MarketplaceSourceSchema,
  outfitter: MarketplaceOutfitterSchema,
  dataPolicy: MarketplaceDataPolicySchema,
  hunts: z.array(MarketplaceHuntContentSchema),
}).superRefine((feed, context) => {
  const listingIds = new Set<string>();
  const sourceUrls = new Set<string>();
  const sourceOrigin = new URL(feed.source.sourceUrl).origin;

  if (new URL(feed.source.feedUrl).origin !== sourceOrigin) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['source', 'feedUrl'],
      message: 'feedUrl must use the registered marketing site origin',
    });
  }
  for (const [field, value] of [
    ['profileUrl', feed.outfitter.profileUrl],
    ['inquiryUrl', feed.outfitter.inquiryUrl],
  ] as const) {
    if (new URL(value).origin !== sourceOrigin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outfitter', field],
        message: `${field} must use the marketing site origin`,
      });
    }
  }

  for (const [index, hunt] of feed.hunts.entries()) {
    if (new URL(hunt.sourceUrl).origin !== sourceOrigin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hunts', index, 'sourceUrl'],
        message: 'sourceUrl must use the marketing site origin',
      });
    }
    if (listingIds.has(hunt.listingId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hunts', index, 'listingId'],
        message: 'listingId must be unique within a source feed',
      });
    }
    if (sourceUrls.has(hunt.sourceUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hunts', index, 'sourceUrl'],
        message: 'sourceUrl must be unique within a source feed',
      });
    }
    listingIds.add(hunt.listingId);
    sourceUrls.add(hunt.sourceUrl);
  }
});

export type MarketplaceMedia = z.infer<typeof MarketplaceMediaSchema>;
export type MarketplaceSection = z.infer<typeof MarketplaceSectionSchema>;
export type MarketplaceSource = z.infer<typeof MarketplaceSourceSchema>;
export type MarketplaceOutfitter = z.infer<typeof MarketplaceOutfitterSchema>;
export type MarketplaceHuntContent = z.infer<typeof MarketplaceHuntContentSchema>;
export type MarketplaceContentFeed = z.infer<typeof MarketplaceContentFeedSchema>;
export const MarketplaceAnyContentFeedSchema = z.union([
  MarketplaceContentFeedSchema,
  MarketplaceContentFeedV2Schema,
]);
export type MarketplaceAnyContentFeed = z.infer<typeof MarketplaceAnyContentFeedSchema>;
