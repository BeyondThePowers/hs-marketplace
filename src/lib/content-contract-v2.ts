import { z } from 'zod';

export const MARKETPLACE_FEED_V2_SCHEMA_VERSION = '2.0' as const;

const uuid = z.string().uuid();
const absoluteUrl = z.string().url();
const contentHash = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const PublicTaxonomyRefSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
});

export const PublicMediaSchema = z.object({
  id: z.string().min(1),
  url: absoluteUrl,
  alt: z.string().min(1),
  caption: z.string().nullable().optional(),
  role: z.enum(['featured', 'gallery', 'section', 'logo', 'profile']),
  sortOrder: z.number().int().nonnegative(),
});

export const PublicInquiryCapabilitySchema = z
  .object({
    mode: z.enum(['source-page', 'source-endpoint', 'email-link']),
    formVersion: z.string().min(1).optional(),
    inquiryPageUrl: absoluteUrl,
    submissionUrl: absoluteUrl.optional(),
    requiredFields: z
      .array(
        z.enum([
          'name',
          'email',
          'phone',
          'preferredDates',
          'hunters',
          'nonHunters',
          'specialRequests',
        ])
      )
      .default(['name', 'email']),
    consentText: z.string().min(1).optional(),
    privacyPolicyUrl: absoluteUrl.optional(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((capability, context) => {
    if (capability.mode === 'source-endpoint' && !capability.submissionUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['submissionUrl'],
        message: 'source-endpoint inquiry mode requires submissionUrl',
      });
    }
  });

export const PublicSourceSchema = z.object({
  sourceId: uuid,
  sourceUrl: absoluteUrl,
  feedUrl: absoluteUrl,
  language: z.string().min(2),
  enabled: z.boolean(),
});

export const PublicOutfitterSchema = z.object({
  outfitterId: uuid,
  name: z.string().min(1),
  tagline: z.string().min(1),
  summary: z.string().min(1),
  profileUrl: absoluteUrl,
  logo: PublicMediaSchema,
  profileImage: PublicMediaSchema,
  countries: z.array(PublicTaxonomyRefSchema).default([]),
  regions: z.array(PublicTaxonomyRefSchema).default([]),
  founded: z.number().int().positive().optional(),
  headquarters: z.string().min(1).optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().min(1).optional(),
      whatsapp: z.string().min(1).optional(),
    })
    .nullable(),
  social: z.array(absoluteUrl).default([]),
  inquiry: PublicInquiryCapabilitySchema,
});

export const PublicLodgeSchema = z.object({
  lodgeId: uuid,
  slug: z.string().min(1),
  sourceUrl: absoluteUrl,
  name: z.string().min(1),
  active: z.boolean(),
  publicationScope: z.enum(['full', 'summary', 'private']),
  standalonePage: z.boolean().default(false),
  contentUpdatedAt: z.string().datetime(),
  classification: z.string().optional(),
  atmosphereLine: z.string().optional(),
  summary: z.string().min(1),
  location: z.object({
    countryCode: z.string().length(2).optional(),
    region: z.string().min(1),
    locality: z.string().optional(),
    privacyMode: z.enum(['exact', 'approximate', 'hidden']),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
    settingTags: z.array(z.string().min(1)).default([]),
  }),
  arrival: z
    .object({
      nearestAirports: z.array(
        z.object({
          code: z.string().min(3).max(4),
          name: z.string().min(1),
          type: z.enum(['international', 'domestic', 'private-airstrip']),
        })
      ),
      transferTime: z.string().optional(),
      options: z
        .array(
          z.object({
            mode: z.string().min(1),
            typicalTime: z.string().min(1),
            included: z.boolean().optional(),
            notes: z.string().optional(),
          })
        )
        .default([]),
    })
    .optional(),
  capacity: z.object({
    guestsMaximum: z.number().int().positive(),
    rooms: z.number().int().positive(),
    bathroomStandard: z.enum(['ensuite-all', 'ensuite-some', 'shared']),
  }),
  rooms: z.record(z.unknown()).optional(),
  amenities: z.array(z.object({ key: z.string().min(1), name: z.string().min(1) })).default([]),
  dining: z.record(z.unknown()).optional(),
  service: z.record(z.unknown()).optional(),
  suitability: z.record(z.unknown()).optional(),
  highlights: z.array(z.string().min(1)).default([]),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
  media: z.array(PublicMediaSchema).default([]),
  contentHash,
});

const PriceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  basis: z.enum([
    'per-hunter-per-trip',
    'per-hunter-per-day',
    'per-group-per-trip',
    'daily-rate',
    'starting-from',
  ]),
  includedHunters: z.number().int().positive().optional(),
  includedGuests: z.number().int().nonnegative().optional(),
  includedHuntingDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const PublicHuntSchema = z.object({
  listingId: uuid,
  slug: z.string().min(1),
  sourceUrl: absoluteUrl,
  title: z.string().min(1),
  summary: z.string().min(1),
  contentStatus: z.enum(['draft', 'ready']),
  contentUpdatedAt: z.string().datetime(),
  active: z.boolean(),
  classification: z.object({
    tripType: z.enum(['BigGame', 'Wingshooting', 'Fishing', 'Combo']),
    primarySpecies: z.array(PublicTaxonomyRefSchema).min(1),
    secondarySpecies: z.array(PublicTaxonomyRefSchema).default([]),
    methods: z.array(PublicTaxonomyRefSchema).min(1),
  }),
  location: z.object({
    country: PublicTaxonomyRefSchema,
    region: PublicTaxonomyRefSchema,
    privacyMode: z.enum(['exact', 'approximate', 'hidden']).default('approximate'),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),
  durationAndParty: z.object({
    nights: z.number().int().nonnegative(),
    huntingDays: z.number().int().positive(),
    minimumHunters: z.number().int().positive().optional(),
    maximumHunters: z.number().int().positive().optional(),
    nonHuntersAllowed: z.boolean().optional(),
  }),
  seasonAndAvailability: z.object({
    display: z.string().min(1),
    startText: z.string().min(1),
    endText: z.string().min(1),
    peak: z.string().optional(),
    mode: z.enum(['inquiry-only', 'verified-windows']),
    lastVerifiedAt: z.string().datetime().optional(),
    windows: z
      .array(
        z.object({
          start: z.string().date(),
          end: z.string().date(),
          status: z.enum(['available', 'limited', 'unavailable']),
        })
      )
      .default([]),
  }),
  methodsAndGuiding: z.object({
    guidingRatio: z.string().min(1),
    arrangement: z.enum(['guided', 'semi-guided', 'self-guided']).default('guided'),
    intensity: z.enum(['low', 'moderate', 'high']),
    physicalDifficulty: z.enum(['easy', 'moderate', 'challenging', 'demanding']).optional(),
    mobilityNotes: z.string().optional(),
  }),
  pricing: z.object({
    displayMode: z.enum(['exact', 'starting-from', 'contact']),
    options: z.array(PriceOptionSchema).min(1),
    depositAmount: z.number().nonnegative().optional(),
    depositPercentage: z.number().min(0).max(100).optional(),
    finalPaymentDueDays: z.number().int().nonnegative().optional(),
    paymentMethods: z.array(z.string().min(1)).default([]),
  }),
  accommodations: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('lodge'),
        regionKey: z.string().min(1),
        regionName: z.string().min(1),
        lodgeId: uuid,
        usage: z.enum(['guaranteed', 'one-of-several', 'optional', 'partial-stay']),
        includedNights: z.number().int().nonnegative().optional(),
        summary: z.string().optional(),
        transferNotes: z.string().optional(),
        }),
        z.object({
          type: z.literal('arranged'),
          regionKey: z.string().min(1),
          regionName: z.string().min(1),
          name: z.string().min(1).optional(),
          classification: z.string().min(1).optional(),
          includedNights: z.number().int().nonnegative().optional(),
          summary: z.string().min(1),
          transferNotes: z.string().optional(),
        }),
      ])
    )
    .default([]),
  territory: z
    .object({
      summary: z.string().optional(),
      size: z.object({ value: z.number().positive(), unit: z.enum(['acres', 'hectares', 'square-km']) }).optional(),
      ownership: z.enum(['private', 'public', 'mixed']).optional(),
      fenceStatus: z.enum(['free-range', 'high-fence', 'mixed', 'not-applicable']).optional(),
      terrain: z.array(z.string().min(1)).default([]),
      elevation: z.string().optional(),
    })
    .optional(),
  travel: z.object({
    nearestAirports: z.array(
      z.object({ code: z.string().min(3).max(4), name: z.string().min(1), type: z.enum(['International', 'Domestic']) })
    ),
    transferTime: z.string().min(1),
  }),
  equipmentAndLicenses: z.object({
    gunRental: z.record(z.unknown()).optional(),
    licenseRequired: z.boolean(),
    licenseCost: z.number().nonnegative().optional(),
    licenseArrangement: z.string().optional(),
  }),
  inclusions: z.array(z.string().min(1)),
  exclusions: z.array(z.string().min(1)),
  optionalServices: z.array(z.record(z.unknown())).default([]),
  terms: z.object({
    cancellationPolicy: z.string().min(1),
    trophyFeePolicy: z.string().optional(),
    woundingPolicy: z.string().optional(),
  }),
  itinerary: z.array(z.record(z.unknown())).default([]),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
  editorial: z.object({
    description: z.string().min(1),
    highlights: z.array(z.string().min(1)).default([]),
    extraSections: z.array(z.record(z.unknown())).default([]),
  }),
  media: z.array(PublicMediaSchema).min(1),
  contentHash,
});

export const PublicGuideSchema = z.object({
  guideId: uuid,
  name: z.string().min(1),
  role: z.string().min(1),
  summary: z.string().min(1),
  languages: z.array(z.string().min(1)).default([]),
  huntListingIds: z.array(uuid).default([]),
  media: z.array(PublicMediaSchema).default([]),
});

export const MarketplaceContentFeedV2Schema = z
  .object({
    schemaVersion: z.literal(MARKETPLACE_FEED_V2_SCHEMA_VERSION),
    generatedAt: z.string().datetime(),
    source: PublicSourceSchema,
    outfitter: PublicOutfitterSchema,
    dataPolicy: z.object({
      pricing: z.literal('source-published-subject-to-confirmation'),
      availability: z.literal('source-published-subject-to-confirmation'),
      contentUse: z.literal('public-factual-syndication'),
    }),
    lodges: z.array(PublicLodgeSchema).default([]),
    guides: z.array(PublicGuideSchema).default([]),
    hunts: z.array(PublicHuntSchema),
    contentHash,
  })
  .superRefine((feed, context) => {
    const sourceOrigin = new URL(feed.source.sourceUrl).origin;
    const lodgeIds = new Set(feed.lodges.map((lodge) => lodge.lodgeId));
    const listingIds = new Set<string>();

    if (feed.source.enabled && feed.outfitter.countries.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outfitter', 'countries'],
        message: 'enabled feeds require at least one outfitter country',
      });
    }

    for (const [field, value] of [
      ['feedUrl', feed.source.feedUrl],
      ['profileUrl', feed.outfitter.profileUrl],
      ['inquiryPageUrl', feed.outfitter.inquiry.inquiryPageUrl],
    ] as const) {
      if (new URL(value).origin !== sourceOrigin) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} must use the source origin` });
      }
    }

    for (const [index, hunt] of feed.hunts.entries()) {
      if (listingIds.has(hunt.listingId)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['hunts', index, 'listingId'], message: 'duplicate listingId' });
      }
      listingIds.add(hunt.listingId);
      for (const accommodation of hunt.accommodations) {
        if (accommodation.type === 'lodge' && !lodgeIds.has(accommodation.lodgeId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['hunts', index, 'accommodations'],
            message: `unknown lodgeId ${accommodation.lodgeId}`,
          });
        }
      }
    }
  });

export type MarketplaceContentFeedV2 = z.infer<typeof MarketplaceContentFeedV2Schema>;
export type PublicHunt = z.infer<typeof PublicHuntSchema>;
export type PublicLodge = z.infer<typeof PublicLodgeSchema>;
export type PublicOutfitter = z.infer<typeof PublicOutfitterSchema>;
export type PublicGuide = z.infer<typeof PublicGuideSchema>;
export type PublicInquiryCapability = z.infer<typeof PublicInquiryCapabilitySchema>;
