import { createServiceClient } from '../src/lib/supabase-server';

const [sourceId, status, recordedBy, ...reasonParts] = process.argv.slice(2);
const allowedStatuses = new Set(['pending_review', 'approved', 'rejected', 'suspended']);

if (!sourceId || !status || !recordedBy || !allowedStatuses.has(status)) {
  console.error(
    'Usage: npm run source:moderate -- <source-id> <pending_review|approved|rejected|suspended> <operator> [reason]'
  );
  process.exit(2);
}

const reason = reasonParts.join(' ').trim() || undefined;
const client = createServiceClient();
const { data, error } = await client.rpc('set_marketplace_source_moderation', {
  target_source_id: sourceId,
  new_status: status,
  recorded_by: recordedBy,
  reason,
});

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(JSON.stringify(Array.isArray(data) ? data[0] : data, null, 2));
