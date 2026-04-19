-- Create annonser table for user-submitted listings
CREATE TABLE public.annonser (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  omrade TEXT,
  antal_rum NUMERIC,
  hyra TEXT,
  beskrivning TEXT,
  kontakt_email TEXT NOT NULL,
  kalla TEXT NOT NULL DEFAULT 'Privat',
  skapad_datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.annonser ENABLE ROW LEVEL SECURITY;

-- Anyone can read listings (public marketplace)
CREATE POLICY "Anyone can view annonser"
ON public.annonser
FOR SELECT
USING (true);

-- Anyone can submit a new listing (no auth required)
CREATE POLICY "Anyone can insert annonser"
ON public.annonser
FOR INSERT
WITH CHECK (
  length(titel) > 0 AND length(titel) <= 200
  AND length(kontakt_email) > 0 AND length(kontakt_email) <= 255
  AND (beskrivning IS NULL OR length(beskrivning) <= 5000)
  AND (omrade IS NULL OR length(omrade) <= 200)
  AND (hyra IS NULL OR length(hyra) <= 50)
);

-- Index for sorting by date
CREATE INDEX idx_annonser_skapad_datum ON public.annonser (skapad_datum DESC);