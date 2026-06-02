
-- 1) annonser: restrict contact columns to authenticated users via column-level GRANTs.
--    Keep listing data readable for anon (titel/omrade/etc), but kontakt_email/telefon/namn require login.
REVOKE SELECT ON public.annonser FROM anon;
GRANT SELECT (
  id, user_id, titel, omrade, antal_rum, storlek_num, hyra, beskrivning,
  bilder, kalla, skapad_datum, status, ledig_datum
) ON public.annonser TO anon;
-- authenticated keeps full access (already had SELECT, INSERT, UPDATE, DELETE)
GRANT SELECT ON public.annonser TO authenticated;

-- 2) alla_annonser view: make it security_invoker and stop leaking kontakt_email through the 'url' field.
DROP VIEW IF EXISTS public.alla_annonser;
CREATE VIEW public.alla_annonser
WITH (security_invoker = on) AS
  SELECT 'scraped-'::text || s.id::text AS id,
         s.titel, s.omrade, s.antal_rum, s.storlek, s.hyra, s.ledig,
         s.url, s.kalla, s.skapad_datum, s.hyra_num, s.storlek_num,
         s.rum_num, s.ledig_datum,
         'scraped'::text AS typ,
         NULL::text[] AS bilder
    FROM public.scraped_annonser s
  UNION ALL
  SELECT 'privat-'::text || a.id::text AS id,
         a.titel, a.omrade,
         CASE WHEN a.antal_rum IS NOT NULL THEN a.antal_rum::text || ' rum'::text ELSE NULL::text END AS antal_rum,
         CASE WHEN a.storlek_num IS NOT NULL THEN a.storlek_num::text || ' m²'::text ELSE NULL::text END AS storlek,
         a.hyra,
         COALESCE(a.ledig_datum::text, a.skapad_datum::text) AS ledig,
         ('/annons/' || a.id::text) AS url,        -- internal link, no email leak
         'Privat'::text AS kalla,
         a.skapad_datum,
         NULLIF(regexp_replace(COALESCE(a.hyra, ''::text), '[^0-9]'::text, ''::text, 'g'::text), ''::text)::integer AS hyra_num,
         a.storlek_num,
         a.antal_rum AS rum_num,
         COALESCE(a.ledig_datum, a.skapad_datum::date) AS ledig_datum,
         'privat'::text AS typ,
         a.bilder
    FROM public.annonser a
   WHERE a.status = 'godkand'::annons_status;

GRANT SELECT ON public.alla_annonser TO anon, authenticated;

-- 3) SECURITY DEFINER user functions: revoke EXECUTE from anon (and PUBLIC) so they
--    can only be called from RLS / authenticated app code, not by unauthenticated clients.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rakna_favoriter(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rakna_favoriter(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.scraped_annonser_calc_helpers() FROM PUBLIC, anon, authenticated;

-- 4) annons-bilder storage bucket: prevent broad listing by requiring a path prefix.
--    Individual object reads via public URL still work.
DROP POLICY IF EXISTS "Public can read annons-bilder" ON storage.objects;
CREATE POLICY "Public can read annons-bilder objects"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'annons-bilder'
    AND name IS NOT NULL
    AND position('/' in name) > 0
  );

-- 5) geocode_cache: add an explicit deny-all SELECT so the empty-policy linter is satisfied
--    and accidental future public policies are less likely.
CREATE POLICY "Deny direct reads of geocode_cache"
  ON public.geocode_cache
  FOR SELECT
  TO anon, authenticated
  USING (false);
