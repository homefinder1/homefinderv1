ALTER TABLE public.annonser ADD COLUMN IF NOT EXISTS storlek_num numeric;

-- Update RLS insert policy to allow the new field (recreate with same constraints)
DROP POLICY IF EXISTS "Authenticated users can insert own annonser" ON public.annonser;

CREATE POLICY "Authenticated users can insert own annonser"
ON public.annonser
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (length(titel) > 0) AND (length(titel) <= 200)
  AND (length(kontakt_email) > 0) AND (length(kontakt_email) <= 255)
  AND ((beskrivning IS NULL) OR (length(beskrivning) <= 5000))
  AND ((omrade IS NULL) OR (length(omrade) <= 200))
  AND ((hyra IS NULL) OR (length(hyra) <= 50))
  AND ((kontakt_namn IS NULL) OR (length(kontakt_namn) <= 200))
  AND ((kontakt_telefon IS NULL) OR (length(kontakt_telefon) <= 30))
  AND ((storlek_num IS NULL) OR (storlek_num > 0 AND storlek_num <= 10000))
);