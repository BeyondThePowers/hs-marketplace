import { syncMarketplaceSource } from '../src/lib/marketplace-ingestion';

const sourceId = process.argv[2];
if (!sourceId) {
  console.error('Usage: npm run source:sync -- <source-id>');
  process.exit(2);
}

const result = await syncMarketplaceSource(sourceId, 'manual');
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'success') process.exit(1);
