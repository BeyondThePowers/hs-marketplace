import { z } from 'zod';
import { MarketplaceContentFeedV2Schema } from './content-contract-v2.ts';

// The marketplace has one publishing contract. Feeds using the retired scalar
// location model are deliberately rejected.
export const MarketplaceAnyContentFeedSchema = MarketplaceContentFeedV2Schema;
export type MarketplaceAnyContentFeed = z.infer<typeof MarketplaceAnyContentFeedSchema>;
