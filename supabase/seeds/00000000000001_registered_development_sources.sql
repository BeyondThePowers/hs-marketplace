INSERT INTO public.marketplace_sources (
  source_id,
  name,
  content_feed_url,
  source_url,
  enabled
)
VALUES
  (
    '6241f059-8fbe-4ea0-9901-353702c1bcd6',
    'JJ Caceria',
    'https://jj-caceria-preview.netlify.app/marketplace-feed.json',
    'https://jj-caceria-preview.netlify.app',
    false
  ),
  (
    'b32d88f2-75bb-4b7d-b4e7-2d737cf44853',
    'Argentina Big Hunting',
    'https://abh-website-demo.huntseeker.pro/marketplace-feed.json',
    'https://abh-website-demo.huntseeker.pro',
    false
  )
ON CONFLICT (source_id) DO UPDATE SET
  name = EXCLUDED.name,
  content_feed_url = EXCLUDED.content_feed_url,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

-- Development sources begin disabled. Enable each source only after its
-- deployed feed validates and a unique webhook credential hash is configured.
