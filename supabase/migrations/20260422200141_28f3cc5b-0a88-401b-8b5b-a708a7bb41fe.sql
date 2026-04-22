-- Add bilder (image URLs) column to annonser
ALTER TABLE public.annonser ADD COLUMN IF NOT EXISTS bilder text[] DEFAULT NULL;

-- Update INSERT policy to allow bilder (max 5)
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
  AND ((bilder IS NULL) OR (array_length(bilder, 1) <= 5))
);

-- Create a public storage bucket for ad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('annons-bilder', 'annons-bilder', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read; only owners can upload/update/delete in their own folder
DROP POLICY IF EXISTS "Public can read annons-bilder" ON storage.objects;
CREATE POLICY "Public can read annons-bilder"
ON storage.objects FOR SELECT
USING (bucket_id = 'annons-bilder');

DROP POLICY IF EXISTS "Users can upload to own annons-bilder folder" ON storage.objects;
CREATE POLICY "Users can upload to own annons-bilder folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'annons-bilder'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own annons-bilder" ON storage.objects;
CREATE POLICY "Users can update own annons-bilder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'annons-bilder'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own annons-bilder" ON storage.objects;
CREATE POLICY "Users can delete own annons-bilder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'annons-bilder'
  AND auth.uid()::text = (storage.foldername(name))[1]
);