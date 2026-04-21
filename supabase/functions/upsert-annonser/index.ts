// Edge Function: upsert-annonser
// Tar emot en POST med { annonser: [...] } och upserterar mot scraped_annonser
// på url-fältet. Kräver Authorization: Bearer <SCRAPER_API_KEY>.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InkommandeAnnons {
  titel?: string | null;
  omrade?: string | null;
  område?: string | null;
  antal_rum?: string | null;
  storlek?: string | null;
  hyra?: string | null;
  ledig?: string | null;
  url?: string | null;
  kalla?: string | null;
  källa?: string | null;
}

function normaliseraKalla(k: string | null | undefined): string {
  if (!k) return "Okänd";
  if (k === "Boplats") return "Boplats Väst";
  return k;
}

function tillRad(a: InkommandeAnnons) {
  const url = a.url ?? null;
  if (!url) return null;
  return {
    titel: a.titel ?? "",
    omrade: a.omrade ?? a.område ?? null,
    antal_rum: a.antal_rum ?? null,
    storlek: a.storlek ?? null,
    hyra: a.hyra ?? null,
    ledig: a.ledig ?? null,
    url,
    kalla: normaliseraKalla(a.kalla ?? a.källa ?? null),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1) Verifiera API-nyckel
  const expected = Deno.env.get("SCRAPER_API_KEY");
  if (!expected) {
    console.error("SCRAPER_API_KEY saknas i miljön");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Parsa kropp
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lista: InkommandeAnnons[] = Array.isArray(body)
    ? (body as InkommandeAnnons[])
    : Array.isArray((body as { annonser?: unknown })?.annonser)
      ? ((body as { annonser: InkommandeAnnons[] }).annonser)
      : [];

  if (!Array.isArray(lista)) {
    return new Response(
      JSON.stringify({ error: "Förväntar { annonser: [...] } eller en array" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Dedupera på URL och rensa tomma
  const seen = new Set<string>();
  const rader: ReturnType<typeof tillRad>[] = [];
  for (const a of lista) {
    const r = tillRad(a);
    if (!r) continue;
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    rader.push(r);
  }

  if (rader.length === 0) {
    return new Response(
      JSON.stringify({ sparade: 0, mottagna: lista.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 3) Upserta i bitar
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const CHUNK = 500;
  let sparade = 0;
  for (let i = 0; i < rader.length; i += CHUNK) {
    const bit = rader.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("scraped_annonser")
      .upsert(bit, { onConflict: "url" });
    if (error) {
      console.error("Upsert-fel:", error);
      return new Response(
        JSON.stringify({
          error: "Database error",
          detail: error.message,
          sparade,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    sparade += bit.length;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      mottagna: lista.length,
      unika: rader.length,
      sparade,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
