-- Allow users to view, update, and delete their OWN annonser (regardless of status)
CREATE POLICY "Users can view own annonser"
ON public.annonser
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own annonser"
ON public.annonser
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND length(titel) > 0
  AND length(titel) <= 200
  AND length(kontakt_email) > 0
  AND length(kontakt_email) <= 255
  AND (beskrivning IS NULL OR length(beskrivning) <= 5000)
  AND (omrade IS NULL OR length(omrade) <= 200)
  AND (hyra IS NULL OR length(hyra) <= 50)
  AND (kontakt_namn IS NULL OR length(kontakt_namn) <= 200)
  AND (kontakt_telefon IS NULL OR length(kontakt_telefon) <= 30)
  AND (storlek_num IS NULL OR (storlek_num > 0 AND storlek_num <= 10000))
  AND (bilder IS NULL OR array_length(bilder, 1) <= 5)
);

CREATE POLICY "Users can delete own annonser"
ON public.annonser
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);