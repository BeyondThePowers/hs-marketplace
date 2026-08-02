import { createServiceClient } from '../src/lib/supabase-server';

const [sourceId, status, recordedBy, ...reasonParts] = process.argv.slice(2);
const allowedStatuses = new Set(['pending', 'active', 'paused', 'withdrawn']);

if (!sourceId || !status || !recordedBy || !allowedStatuses.has(status)) {
  console.error(
    'Usage: npm run source:status -- <source-id> <pending|active|paused|withdrawn> <operator> [reason]'
  );
  process.exit(2);
}

const reason = reasonParts.join(' ').trim() || undefined;
const client = createServiceClient();
const { data, error } = await client.rpc('set_marketplace_source_participation', {
  target_source_id: sourceId,
  new_status: status,
  recorded_by: recordedBy,
  reason,
});

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      sourceId: data.source_id,
      participationStatus: data.participation_status,
      consentConfirmedAt: data.consent_confirmed_at,
      participationChangedAt: data.participation_changed_at,
      participationReason: data.participation_reason,
    },
    null,
    2
  )
);
