BEGIN;

ALTER TABLE public.marketplace_publication_revisions
  DROP CONSTRAINT IF EXISTS marketplace_publication_revisions_build_status_check;

ALTER TABLE public.marketplace_publication_revisions
  ADD CONSTRAINT marketplace_publication_revisions_build_status_check
  CHECK (build_status IN ('pending', 'requested', 'building', 'deployed', 'verified', 'failed', 'superseded'));

CREATE OR REPLACE FUNCTION public.marketplace_claim_publication_build(
  minimum_age_seconds INTEGER DEFAULT 30,
  stale_after_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (revision_id UUID, revision_hash TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed public.marketplace_publication_revisions%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('marketplace-publication-build'));

  UPDATE public.marketplace_publication_revisions
  SET
    build_status = 'failed',
    error = COALESCE(error, 'Build request exceeded the stale timeout'),
    updated_at = NOW()
  WHERE build_status IN ('requested', 'building')
    AND COALESCE(build_started_at, build_requested_at, accepted_at)
      < NOW() - make_interval(mins => GREATEST(stale_after_minutes, 1));

  IF EXISTS (
    SELECT 1
    FROM public.marketplace_publication_revisions
    WHERE build_status IN ('requested', 'building')
  ) THEN
    RETURN;
  END IF;

  SELECT *
  INTO claimed
  FROM public.marketplace_publication_revisions
  WHERE build_status = 'pending'
    AND accepted_at <= NOW() - make_interval(secs => GREATEST(minimum_age_seconds, 0))
  ORDER BY accepted_at DESC, created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF claimed.id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.marketplace_publication_revisions
  SET
    build_status = 'superseded',
    error = NULL,
    updated_at = NOW()
  WHERE build_status = 'pending'
    AND id <> claimed.id
    AND accepted_at <= claimed.accepted_at;

  UPDATE public.marketplace_publication_revisions
  SET
    build_status = 'requested',
    build_requested_at = NOW(),
    error = NULL,
    updated_at = NOW()
  WHERE id = claimed.id;

  revision_id := claimed.id;
  revision_hash := claimed.revision_hash;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_verify_publication_build(
  target_revision_id UUID,
  target_revision_hash TEXT,
  target_deployment_id TEXT,
  target_deployment_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_accepted_at TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('marketplace-publication-build'));

  SELECT accepted_at
  INTO target_accepted_at
  FROM public.marketplace_publication_revisions
  WHERE id = target_revision_id
    AND revision_hash = target_revision_hash;

  IF target_accepted_at IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.marketplace_publication_revisions
  SET
    build_status = 'superseded',
    error = NULL,
    updated_at = NOW()
  WHERE id <> target_revision_id
    AND accepted_at <= target_accepted_at
    AND build_status IN ('pending', 'requested', 'building', 'deployed');

  UPDATE public.marketplace_publication_revisions
  SET
    build_status = 'verified',
    build_started_at = COALESCE(build_started_at, build_requested_at),
    deployed_at = NOW(),
    verified_at = NOW(),
    deployment_id = target_deployment_id,
    deployment_url = target_deployment_url,
    error = NULL,
    updated_at = NOW()
  WHERE id = target_revision_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_fail_publication_build(
  target_revision_id UUID,
  failure_message TEXT
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.marketplace_publication_revisions
  SET
    build_status = 'failed',
    error = LEFT(failure_message, 1000),
    updated_at = NOW()
  WHERE id = target_revision_id
    AND build_status IN ('requested', 'building');
$$;

CREATE OR REPLACE FUNCTION public.marketplace_get_public_revision()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'id', revision.id,
        'revisionHash', revision.revision_hash,
        'acceptedAt', revision.accepted_at
      )
      FROM public.marketplace_publication_revisions AS revision
      ORDER BY revision.accepted_at DESC, revision.created_at DESC
      LIMIT 1
    ),
    'null'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.marketplace_get_public_catalog()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'publicationRevision', public.marketplace_get_public_revision(),
    'hunts', COALESCE((
      SELECT jsonb_agg(to_jsonb(hunt) ORDER BY hunt.title, hunt.listing_id)
      FROM public.marketplace_public_hunts AS hunt
    ), '[]'::jsonb),
    'huntMedia', COALESCE((
      SELECT jsonb_agg(to_jsonb(media) ORDER BY media.hunt_id, media.sort_order, media.id)
      FROM public.marketplace_public_hunt_media AS media
    ), '[]'::jsonb),
    'outfitters', COALESCE((
      SELECT jsonb_agg(to_jsonb(outfitter) ORDER BY outfitter.name, outfitter.public_id)
      FROM public.marketplace_public_outfitters AS outfitter
    ), '[]'::jsonb),
    'lodges', COALESCE((
      SELECT jsonb_agg(to_jsonb(lodge) ORDER BY lodge.name, lodge.lodge_id)
      FROM public.marketplace_public_lodges AS lodge
    ), '[]'::jsonb),
    'huntLodges', COALESCE((
      SELECT jsonb_agg(to_jsonb(relation) ORDER BY relation.hunt_id, relation.sort_order, relation.lodge_record_id)
      FROM public.marketplace_public_hunt_lodges AS relation
    ), '[]'::jsonb),
    'lodgeMedia', COALESCE((
      SELECT jsonb_agg(to_jsonb(media) ORDER BY media.lodge_record_id, media.sort_order, media.id)
      FROM public.marketplace_public_lodge_media AS media
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.marketplace_claim_publication_build(INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marketplace_verify_publication_build(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marketplace_fail_publication_build(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marketplace_get_public_revision() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.marketplace_claim_publication_build(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_verify_publication_build(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_fail_publication_build(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_get_public_revision() TO anon, authenticated, service_role;

COMMIT;
