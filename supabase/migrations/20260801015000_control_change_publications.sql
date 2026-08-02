BEGIN;

CREATE OR REPLACE FUNCTION public.marketplace_queue_control_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  affected_source_id TEXT;
  revision_material TEXT;
BEGIN
  affected_source_id := NEW.source_id;
  revision_material := concat_ws(
    '|',
    'marketplace-control',
    TG_TABLE_NAME,
    affected_source_id,
    clock_timestamp()::TEXT,
    txid_current()::TEXT
  );

  INSERT INTO public.marketplace_publication_revisions (
    revision_hash,
    changed_source_ids,
    build_status,
    accepted_at,
    updated_at
  )
  VALUES (
    'sha256:' || encode(digest(revision_material, 'sha256'), 'hex'),
    ARRAY[affected_source_id],
    'pending',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_queue_source_control_revision
  ON public.marketplace_sources;
CREATE TRIGGER marketplace_queue_source_control_revision
AFTER UPDATE OF participation_status, feed_enabled
ON public.marketplace_sources
FOR EACH ROW
WHEN (
  OLD.participation_status IS DISTINCT FROM NEW.participation_status
  OR OLD.feed_enabled IS DISTINCT FROM NEW.feed_enabled
)
EXECUTE FUNCTION public.marketplace_queue_control_revision();

DROP TRIGGER IF EXISTS marketplace_queue_outfitter_control_revision
  ON public.marketplace_outfitters;
CREATE TRIGGER marketplace_queue_outfitter_control_revision
AFTER UPDATE OF central_moderation_status
ON public.marketplace_outfitters
FOR EACH ROW
WHEN (OLD.central_moderation_status IS DISTINCT FROM NEW.central_moderation_status)
EXECUTE FUNCTION public.marketplace_queue_control_revision();

DROP TRIGGER IF EXISTS marketplace_queue_hunt_control_revision
  ON public.marketplace_hunts;
CREATE TRIGGER marketplace_queue_hunt_control_revision
AFTER UPDATE OF central_moderation_status
ON public.marketplace_hunts
FOR EACH ROW
WHEN (OLD.central_moderation_status IS DISTINCT FROM NEW.central_moderation_status)
EXECUTE FUNCTION public.marketplace_queue_control_revision();

DROP TRIGGER IF EXISTS marketplace_queue_lodge_control_revision
  ON public.marketplace_lodges;
CREATE TRIGGER marketplace_queue_lodge_control_revision
AFTER UPDATE OF central_moderation_status
ON public.marketplace_lodges
FOR EACH ROW
WHEN (OLD.central_moderation_status IS DISTINCT FROM NEW.central_moderation_status)
EXECUTE FUNCTION public.marketplace_queue_control_revision();

COMMIT;
