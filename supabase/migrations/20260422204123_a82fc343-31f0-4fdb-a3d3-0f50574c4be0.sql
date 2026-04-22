-- Tabell för sparade favoriter
CREATE TABLE public.favoriter (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  annons_id TEXT NOT NULL,
  skapad_datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, annons_id)
);

ALTER TABLE public.favoriter ENABLE ROW LEVEL SECURITY;

-- RLS policies: användare kan bara hantera sina egna favoriter
CREATE POLICY "Användare kan se sina egna favoriter"
  ON public.favoriter
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Användare kan lägga till egna favoriter"
  ON public.favoriter
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND length(annons_id) > 0 AND length(annons_id) <= 100);

CREATE POLICY "Användare kan ta bort egna favoriter"
  ON public.favoriter
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public-tellbar: räkna favoriter per annons (för "❤️ 124")
-- Skapa en funktion som returnerar antalet, körbar av alla
CREATE OR REPLACE FUNCTION public.rakna_favoriter(_annons_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.favoriter WHERE annons_id = _annons_id;
$$;

CREATE INDEX idx_favoriter_user ON public.favoriter(user_id);
CREATE INDEX idx_favoriter_annons ON public.favoriter(annons_id);