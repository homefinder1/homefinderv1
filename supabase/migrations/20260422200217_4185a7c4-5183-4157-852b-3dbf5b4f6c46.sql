CREATE OR REPLACE VIEW public.alla_annonser AS
SELECT 'scraped-'::text || s.id::text AS id,
   s.titel,
   s.omrade,
   s.antal_rum,
   s.storlek,
   s.hyra,
   s.ledig,
   s.url,
   s.kalla,
   s.skapad_datum,
   s.hyra_num,
   s.storlek_num,
   s.rum_num,
   s.ledig_datum,
   'scraped'::text AS typ,
   NULL::text[] AS bilder
  FROM public.scraped_annonser s
UNION ALL
SELECT 'privat-'::text || a.id::text AS id,
   a.titel,
   a.omrade,
   CASE WHEN a.antal_rum IS NOT NULL THEN a.antal_rum::text || ' rum' ELSE NULL END AS antal_rum,
   CASE WHEN a.storlek_num IS NOT NULL THEN a.storlek_num::text || ' m²' ELSE NULL END AS storlek,
   a.hyra,
   COALESCE(a.ledig_datum::text, a.skapad_datum::text) AS ledig,
   'mailto:'::text || a.kontakt_email AS url,
   'Privat'::text AS kalla,
   a.skapad_datum,
   NULLIF(regexp_replace(COALESCE(a.hyra, ''), '[^0-9]', '', 'g'), '')::integer AS hyra_num,
   a.storlek_num,
   a.antal_rum AS rum_num,
   COALESCE(a.ledig_datum, a.skapad_datum::date) AS ledig_datum,
   'privat'::text AS typ,
   a.bilder
  FROM public.annonser a
 WHERE a.status = 'godkand'::annons_status;