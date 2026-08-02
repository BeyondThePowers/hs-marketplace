-- Return every public catalog entity from one PostgreSQL statement so a static
-- build cannot mix records observed before and after a concurrent sync.
CREATE OR REPLACE FUNCTION public.marketplace_get_public_catalog()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
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

REVOKE ALL ON FUNCTION public.marketplace_get_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketplace_get_public_catalog() TO anon, authenticated;
