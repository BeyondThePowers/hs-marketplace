BEGIN;

CREATE OR REPLACE FUNCTION public.marketplace_refresh_publication_for_source(
  target_source_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_outfitters AS outfitter
  SET
    published = (
      outfitter.central_moderation_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_sources AS source
        WHERE source.source_id = target_source_id
          AND source.participation_status = 'active'
          AND source.feed_enabled = TRUE
      )
    ),
    updated_at = NOW()
  WHERE outfitter.source_id = target_source_id;

  UPDATE public.marketplace_hunts AS hunt
  SET
    published = (
      hunt.source_active = TRUE
      AND hunt.orphaned_at IS NULL
      AND hunt.content_status = 'ready'
      AND hunt.central_moderation_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_sources AS source
        WHERE source.source_id = target_source_id
          AND source.participation_status = 'active'
          AND source.feed_enabled = TRUE
      )
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_outfitters AS outfitter
        WHERE outfitter.source_id = target_source_id
          AND outfitter.central_moderation_status = 'approved'
      )
    ),
    updated_at = NOW()
  WHERE hunt.source_id = target_source_id;

  UPDATE public.marketplace_lodges AS lodge
  SET
    published = (
      lodge.source_active = TRUE
      AND lodge.orphaned_at IS NULL
      AND lodge.publication_scope <> 'private'
      AND lodge.central_moderation_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_sources AS source
        WHERE source.source_id = target_source_id
          AND source.participation_status = 'active'
          AND source.feed_enabled = TRUE
      )
      AND EXISTS (
        SELECT 1
        FROM public.marketplace_outfitters AS outfitter
        WHERE outfitter.source_id = target_source_id
          AND outfitter.central_moderation_status = 'approved'
      )
    ),
    updated_at = NOW()
  WHERE lodge.source_id = target_source_id;
END;
$$;

DROP FUNCTION IF EXISTS public.set_marketplace_source_moderation(TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION public.set_marketplace_source_moderation(
  target_source_id TEXT,
  new_status TEXT,
  recorded_by TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  source_id TEXT,
  moderation_status TEXT,
  outfitters_changed INTEGER,
  hunts_changed INTEGER,
  lodges_changed INTEGER,
  changed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  change_time TIMESTAMPTZ := NOW();
  outfitter_count INTEGER;
  hunt_count INTEGER;
  lodge_count INTEGER;
BEGIN
  IF new_status NOT IN ('pending_review', 'approved', 'rejected', 'suspended') THEN
    RAISE EXCEPTION 'Invalid marketplace moderation status';
  END IF;

  IF NULLIF(BTRIM(recorded_by), '') IS NULL THEN
    RAISE EXCEPTION 'A moderation change requires an operator identity';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.marketplace_sources AS source
    WHERE source.source_id = target_source_id
  ) THEN
    RAISE EXCEPTION 'Unknown marketplace source';
  END IF;

  UPDATE public.marketplace_outfitters
  SET
    central_moderation_status = new_status,
    moderation_changed_at = change_time,
    moderation_changed_by = BTRIM(recorded_by),
    moderation_reason = NULLIF(BTRIM(reason), ''),
    updated_at = change_time
  WHERE marketplace_outfitters.source_id = target_source_id;
  GET DIAGNOSTICS outfitter_count = ROW_COUNT;

  UPDATE public.marketplace_hunts
  SET
    central_moderation_status = new_status,
    moderation_changed_at = change_time,
    moderation_changed_by = BTRIM(recorded_by),
    moderation_reason = NULLIF(BTRIM(reason), ''),
    updated_at = change_time
  WHERE marketplace_hunts.source_id = target_source_id;
  GET DIAGNOSTICS hunt_count = ROW_COUNT;

  UPDATE public.marketplace_lodges
  SET
    central_moderation_status = new_status,
    moderation_changed_at = change_time,
    moderation_changed_by = BTRIM(recorded_by),
    moderation_reason = NULLIF(BTRIM(reason), ''),
    updated_at = change_time
  WHERE marketplace_lodges.source_id = target_source_id;
  GET DIAGNOSTICS lodge_count = ROW_COUNT;

  PERFORM public.marketplace_refresh_publication_for_source(target_source_id);

  RETURN QUERY SELECT
    target_source_id,
    new_status,
    outfitter_count,
    hunt_count,
    lodge_count,
    change_time;
END;
$$;

REVOKE ALL ON FUNCTION public.set_marketplace_source_moderation(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_marketplace_source_moderation(TEXT, TEXT, TEXT, TEXT)
  TO service_role;

COMMIT;
