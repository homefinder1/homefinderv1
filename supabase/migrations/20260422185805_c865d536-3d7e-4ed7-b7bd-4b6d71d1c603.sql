-- Vyn alla_annonser blockerar typändring; droppa och återskapa
DROP VIEW IF EXISTS public.alla_annonser;

ALTER TABLE public.scraped_annonser
  ALTER COLUMN storlek_num TYPE NUMERIC USING storlek_num::NUMERIC;

-- Återskapa vyn (identisk definition)
CREATE VIEW public.alla_annonser AS
  SELECT 'scraped-'::text || scraped_annonser.id::text AS id,
     scraped_annonser.titel,
     scraped_annonser.omrade,
     scraped_annonser.antal_rum,
     scraped_annonser.storlek,
     scraped_annonser.hyra,
     scraped_annonser.ledig,
     scraped_annonser.url,
     scraped_annonser.kalla,
     scraped_annonser.skapad_datum,
     scraped_annonser.hyra_num,
     scraped_annonser.storlek_num,
     scraped_annonser.rum_num,
     scraped_annonser.ledig_datum,
     'scraped'::text AS typ
    FROM public.scraped_annonser
 UNION ALL
  SELECT 'privat-'::text || annonser.id::text AS id,
     annonser.titel,
     annonser.omrade,
         CASE
             WHEN annonser.antal_rum IS NOT NULL THEN annonser.antal_rum::text || ' rum'::text
             ELSE NULL::text
         END AS antal_rum,
     NULL::text AS storlek,
     annonser.hyra,
     annonser.skapad_datum::text AS ledig,
     'mailto:'::text || annonser.kontakt_email AS url,
     'Privat'::text AS kalla,
     annonser.skapad_datum,
     NULLIF(regexp_replace(COALESCE(annonser.hyra, ''::text), '[^0-9]'::text, ''::text, 'g'::text), ''::text)::integer AS hyra_num,
     NULL::numeric AS storlek_num,
     annonser.antal_rum AS rum_num,
     annonser.skapad_datum::date AS ledig_datum,
     'privat'::text AS typ
    FROM public.annonser
   WHERE annonser.status = 'godkand'::annons_status;

-- Uppdatera triggerfunktionen så ytan bevarar decimal
CREATE OR REPLACE FUNCTION public.scraped_annonser_calc_helpers()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  rum_match TEXT;
  storlek_match TEXT;
BEGIN
  NEW.hyra_num := NULLIF(regexp_replace(COALESCE(NEW.hyra, ''), '[^0-9]', '', 'g'), '')::INTEGER;

  storlek_match := (regexp_match(COALESCE(NEW.storlek, ''), '(\d+(?:[.,]\d+)?)'))[1];
  IF storlek_match IS NOT NULL THEN
    NEW.storlek_num := replace(storlek_match, ',', '.')::NUMERIC;
  ELSE
    NEW.storlek_num := NULL;
  END IF;

  rum_match := (regexp_match(COALESCE(NEW.antal_rum, ''), '(\d+(?:[.,]\d+)?)'))[1];
  IF rum_match IS NOT NULL THEN
    NEW.rum_num := replace(rum_match, ',', '.')::NUMERIC;
  ELSE
    NEW.rum_num := NULL;
  END IF;

  IF NEW.ledig ~ '^\d{4}-\d{2}-\d{2}' THEN
    BEGIN
      NEW.ledig_datum := substring(NEW.ledig, 1, 10)::DATE;
    EXCEPTION WHEN OTHERS THEN
      NEW.ledig_datum := NULL;
    END;
  ELSE
    NEW.ledig_datum := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS scraped_annonser_calc_helpers_trigger ON public.scraped_annonser;
CREATE TRIGGER scraped_annonser_calc_helpers_trigger
  BEFORE INSERT OR UPDATE ON public.scraped_annonser
  FOR EACH ROW EXECUTE FUNCTION public.scraped_annonser_calc_helpers();

-- Räkna om alla befintliga rader
UPDATE public.scraped_annonser
SET storlek_num = CASE
  WHEN (regexp_match(COALESCE(storlek, ''), '(\d+(?:[.,]\d+)?)'))[1] IS NOT NULL
  THEN replace((regexp_match(COALESCE(storlek, ''), '(\d+(?:[.,]\d+)?)'))[1], ',', '.')::NUMERIC
  ELSE NULL
END;