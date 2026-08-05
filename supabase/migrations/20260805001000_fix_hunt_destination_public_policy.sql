BEGIN;

DROP POLICY IF EXISTS marketplace_hunt_destinations_public_select
  ON public.marketplace_hunt_destinations;

CREATE POLICY marketplace_hunt_destinations_public_select
  ON public.marketplace_hunt_destinations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.marketplace_hunts AS hunt
      WHERE hunt.id = marketplace_hunt_destinations.hunt_id
        AND hunt.published = TRUE
    )
  );

COMMIT;
