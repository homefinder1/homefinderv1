// Proxy för Nominatim geokodning med DB-cache och rate limiting.
// Nominatim tillåter max 1 req/sek per IP — vi serialiserar via lås
// och cachar resultat i geocode_cache permanent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Per-isolate serialisering: håller koll på senaste fetch så vi väntar minst 1100ms
let lastFetchAt = 0;
let chain: Promise<unknown> = Promise.resolve();

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchNominatimSerialized(
  q: string,
): Promise<{ lat: number; lon: number } | null> {
  // Köa anropet bakom föregående
  const run = chain.then(async () => {
    const elapsed = Date.now() - lastFetchAt;
    if (elapsed < 1100) await delay(1100 - elapsed);

    const upstream = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=se&q=${encodeURIComponent(q)}`;
    const res = await fetch(upstream, {
      headers: {
        "User-Agent": "HomeFinder.se/1.0 (geocode-proxy; contact@homefinder.se)",
        Accept: "application/json",
        "Accept-Language": "sv",
      },
    });
    lastFetchAt = Date.now();

    if (!res.ok) {
      throw new Error(`Upstream ${res.status}`);
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = data[0];
    return first
      ? { lat: parseFloat(first.lat), lon: parseFloat(first.lon) }
      : null;
  });
  // Säkerställ att kedjan inte bryts vid fel
  chain = run.catch(() => undefined);
  return run as Promise<{ lat: number; lon: number } | null>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    if (!q) {
      return new Response(
        JSON.stringify({ error: "Missing 'q' query parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // 1) Försök DB-cache
    const { data: cached } = await supabase
      .from("geocode_cache")
      .select("lat,lon,found")
      .eq("query", q)
      .maybeSingle();

    if (cached) {
      const result = cached.found ? { lat: cached.lat, lon: cached.lon } : null;
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=2592000, s-maxage=2592000",
          ...corsHeaders,
        },
      });
    }

    // 2) Hämta från Nominatim (serialiserat, 1 req/sek)
    let result: { lat: number; lon: number } | null = null;
    try {
      result = await fetchNominatimSerialized(q);
    } catch (err) {
      // Vid 429/upstream-fel: returnera null istället för 502 så UI inte spinnar
      console.error("Nominatim error:", err);
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Kort cache vid fel så vi försöker igen snart
          "Cache-Control": "public, max-age=60",
          ...corsHeaders,
        },
      });
    }

    // 3) Skriv till cache (även null-resultat så vi inte frågar igen)
    await supabase.from("geocode_cache").upsert(
      {
        query: q,
        lat: result?.lat ?? null,
        lon: result?.lon ?? null,
        found: result !== null,
      },
      { onConflict: "query" },
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000",
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
