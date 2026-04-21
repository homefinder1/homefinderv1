
-- 1. profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fornamn TEXT NOT NULL DEFAULT '',
  efternamn TEXT NOT NULL DEFAULT '',
  telefon TEXT NOT NULL DEFAULT '',
  skapad_datum TIMESTAMPTZ NOT NULL DEFAULT now(),
  uppdaterad_datum TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup using metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, fornamn, efternamn, telefon)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'fornamn', ''),
    COALESCE(NEW.raw_user_meta_data->>'efternamn', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefon', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add owner + contact fields on annonser
ALTER TABLE public.annonser
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN kontakt_namn TEXT,
  ADD COLUMN kontakt_telefon TEXT;

-- Tighten insert policy: require auth + ownership when user_id is set
DROP POLICY IF EXISTS "Anyone can insert annonser" ON public.annonser;

CREATE POLICY "Authenticated users can insert own annonser"
  ON public.annonser FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND length(titel) > 0 AND length(titel) <= 200
    AND length(kontakt_email) > 0 AND length(kontakt_email) <= 255
    AND (beskrivning IS NULL OR length(beskrivning) <= 5000)
    AND (omrade IS NULL OR length(omrade) <= 200)
    AND (hyra IS NULL OR length(hyra) <= 50)
    AND (kontakt_namn IS NULL OR length(kontakt_namn) <= 200)
    AND (kontakt_telefon IS NULL OR length(kontakt_telefon) <= 30)
  );
