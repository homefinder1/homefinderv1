CREATE TABLE IF NOT EXISTS public.geocode_cache (
  query TEXT PRIMARY KEY,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  found BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;

-- Endast service role (edge function) skriver/läser. Inga policies = ingen public access.
CREATE INDEX IF NOT EXISTS geocode_cache_created_at_idx ON public.geocode_cache(created_at);