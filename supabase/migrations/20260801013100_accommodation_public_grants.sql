BEGIN;

GRANT SELECT (accommodations)
  ON public.marketplace_hunts TO anon, authenticated;

GRANT SELECT (standalone_page)
  ON public.marketplace_lodges TO anon, authenticated;

COMMIT;
