
-- 1) Skapa scraped_annonser-tabell
CREATE TABLE public.scraped_annonser (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  omrade TEXT,
  antal_rum TEXT,
  storlek TEXT,
  hyra TEXT,
  ledig TEXT,
  url TEXT NOT NULL UNIQUE,
  kalla TEXT NOT NULL,
  skapad_datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Hjälpkolumner som fylls i automatiskt via trigger
  hyra_num INTEGER,
  storlek_num INTEGER,
  rum_num NUMERIC,
  ledig_datum DATE
);

-- Funktion som beräknar numeriska hjälpkolumner
CREATE OR REPLACE FUNCTION public.scraped_annonser_calc_helpers()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  rum_match TEXT;
BEGIN
  -- hyra_num: extrahera alla siffror
  NEW.hyra_num := NULLIF(regexp_replace(COALESCE(NEW.hyra, ''), '[^0-9]', '', 'g'), '')::INTEGER;

  -- storlek_num: ta heltalsdelen före komma
  NEW.storlek_num := NULLIF(regexp_replace(split_part(COALESCE(NEW.storlek, ''), ',', 1), '[^0-9]', '', 'g'), '')::INTEGER;

  -- rum_num: första talet i antal_rum
  rum_match := (regexp_match(COALESCE(NEW.antal_rum, ''), '(\d+(?:[.,]\d+)?)'))[1];
  IF rum_match IS NOT NULL THEN
    NEW.rum_num := replace(rum_match, ',', '.')::NUMERIC;
  ELSE
    NEW.rum_num := NULL;
  END IF;

  -- ledig_datum: parsa ISO-datum YYYY-MM-DD
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
$$;

CREATE TRIGGER trg_scraped_annonser_calc_helpers
BEFORE INSERT OR UPDATE ON public.scraped_annonser
FOR EACH ROW
EXECUTE FUNCTION public.scraped_annonser_calc_helpers();

-- Index för snabb filtrering/paginering
CREATE INDEX idx_scraped_kalla ON public.scraped_annonser (kalla);
CREATE INDEX idx_scraped_hyra_num ON public.scraped_annonser (hyra_num);
CREATE INDEX idx_scraped_storlek_num ON public.scraped_annonser (storlek_num);
CREATE INDEX idx_scraped_rum_num ON public.scraped_annonser (rum_num);
CREATE INDEX idx_scraped_ledig_datum ON public.scraped_annonser (ledig_datum);
CREATE INDEX idx_scraped_skapad ON public.scraped_annonser (skapad_datum DESC);

-- Trigram för snabb LIKE-sökning på område/titel
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_scraped_omrade_trgm ON public.scraped_annonser USING gin (omrade gin_trgm_ops);
CREATE INDEX idx_scraped_titel_trgm ON public.scraped_annonser USING gin (titel gin_trgm_ops);

-- RLS
ALTER TABLE public.scraped_annonser ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alla kan läsa scraped annonser"
ON public.scraped_annonser
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Bara admins kan hantera scraped annonser"
ON public.scraped_annonser
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) VIEW som förenar scraped + privata annonser
CREATE OR REPLACE VIEW public.alla_annonser
WITH (security_invoker = true) AS
SELECT
  ('scraped-' || id::TEXT) AS id,
  titel,
  omrade,
  antal_rum,
  storlek,
  hyra,
  ledig,
  url,
  kalla,
  skapad_datum,
  hyra_num,
  storlek_num,
  rum_num,
  ledig_datum,
  'scraped'::TEXT AS typ
FROM public.scraped_annonser
UNION ALL
SELECT
  ('privat-' || id::TEXT) AS id,
  titel,
  omrade,
  CASE WHEN antal_rum IS NOT NULL THEN antal_rum::TEXT || ' rum' ELSE NULL END AS antal_rum,
  NULL AS storlek,
  hyra,
  skapad_datum::TEXT AS ledig,
  ('mailto:' || kontakt_email) AS url,
  'Privat'::TEXT AS kalla,
  skapad_datum,
  NULLIF(regexp_replace(COALESCE(hyra, ''), '[^0-9]', '', 'g'), '')::INTEGER AS hyra_num,
  NULL::INTEGER AS storlek_num,
  antal_rum AS rum_num,
  skapad_datum::DATE AS ledig_datum,
  'privat'::TEXT AS typ
FROM public.annonser
WHERE status = 'godkand';
