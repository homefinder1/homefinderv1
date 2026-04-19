// Proxy för Nominatim geokodning för att kringgå CORS-problem.
// Ger även enkel cache via Cache API.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    if (!q) {
      return new Response(JSON.stringify({ error: "Missing 'q' query parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const upstream = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=se&q=${encodeURIComponent(q)}`;

    const res = await fetch(upstream, {
      headers: {
        // Nominatim kräver en identifierbar User-Agent
        "User-Agent": "HomeFinder.se/1.0 (geocode-proxy)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream responded ${res.status}` }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = data[0];
    const result = first ? { lat: parseFloat(first.lat), lon: parseFloat(first.lon) } : null;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cacha i 30 dagar i CDN/browser - adresser ändras sällan
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
