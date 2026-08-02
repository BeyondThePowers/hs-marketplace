import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { MarketplaceAnyContentFeedSchema } from '../src/lib/marketplace-content-schema.ts';

const paths = process.argv.slice(2);
if (!paths.length) {
  console.error('Usage: npm run feed:validate -- <feed.json> [feed.json ...]');
  process.exit(2);
}

let failed = false;
for (const inputPath of paths) {
  const path = resolve(process.cwd(), inputPath);
  try {
    const feed = MarketplaceAnyContentFeedSchema.parse(JSON.parse(await readFile(path, 'utf8')));
    console.log(`${inputPath}: valid ${feed.schemaVersion} feed with ${feed.hunts.length} hunts`);
  } catch (error) {
    failed = true;
    console.error(`${inputPath}: invalid feed`);
    if (error && typeof error === 'object' && 'issues' in error) {
      for (const issue of error.issues) {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      console.error(error);
    }
  }
}

if (failed) process.exit(1);
