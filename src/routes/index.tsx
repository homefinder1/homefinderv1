import { createFileRoute } from "@tanstack/react-router";
import { Building2, Search, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { AnnonsCard } from "@/components/AnnonsCard";
import { useAnnonser } from "@/hooks/useAnnonser";
import { supabase } from "@/integrations/supabase/client";
import type { Annons, Source } from "@/data/listings";

const SITE_URL = "https://homefinder.se";

const META_TITLE = "Lediga hyreslägenheter i Sverige — HomeFinder";
const META_DESCRIPTION =
  "Hitta din nästa hyresrätt på HomeFinder. Vi samlar lediga lägenheter från MKB, Boplats, HomeQ och fler källor på ett ställe.";

function normaliseraKälla(k: string | undefined): Source {
  if (!k) return "MKB";
  if (k === "Boplats") return "Boplats Väst";
  return k as Source;
}

function rensaStorlek(s: string | null | undefined): string | undefined {
  if (!s) return undefined;
  const t = s.trim();
  if (!t || t.toLowerCase() === "okänd") return undefined;
  return t;
}

interface LoaderData {
  annonser: Annons[];
  total: number;
}

export const Route = createFileRoute("/")({
  loader: async (): Promise<LoaderData> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, count, error } = await (supabase as any)
        .from("alla_annonser")
        .select("*", { count: "exact" })
        .order("skapad_datum", { ascending: false, nullsFirst: false })
        .order("id", { ascending: true })
        .range(0, 5);

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        id: string;
        titel: string;
        omrade: string | null;
        antal_rum: string | null;
        storlek: string | null;
        hyra: string | null;
        ledig: string | null;
        url: string;
        kalla: string;
        skapad_datum: string;
      }>;

      const annonser: Annons[] = rows.map((r) => ({
        id: r.id,
        titel: r.titel,
        område: r.omrade ?? "",
        antal_rum: r.antal_rum ?? "—",
        storlek: rensaStorlek(r.storlek),
        hyra: r.hyra ?? "—",
        ledig: r.ledig ?? "",
        url: r.url,
        källa: normaliseraKälla(r.kalla),
        skapad: r.skapad_datum,
      }));

      return { annonser, total: count ?? annonser.length };
    } catch {
      return { annonser: [], total: 0 };
    }
  },
  head: ({ loaderData }) => {
    const annonser = loaderData?.annonser ?? [];

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Lediga hyreslägenheter",
      itemListElement: annonser.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Apartment",
          name: a.titel,
          url: a.url,
          address: a.område
            ? {
                "@type": "PostalAddress",
                addressLocality: a.område,
                addressCountry: "SE",
              }
            : undefined,
          numberOfRooms: a.antal_rum,
          floorSize: a.storlek
            ? { "@type": "QuantitativeValue", value: a.storlek }
            : undefined,
          offers: {
            "@type": "Offer",
            price: a.hyra,
            priceCurrency: "SEK",
          },
        },
      })),
    };

    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HomeFinder",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/sok?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    return {
      meta: [
        { title: META_TITLE },
        { name: "description", content: META_DESCRIPTION },
        { property: "og:title", content: META_TITLE },
        { property: "og:description", content: META_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: SITE_URL },
        { name: "twitter:title", content: META_TITLE },
        { name: "twitter:description", content: META_DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: SITE_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(website),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(itemList),
        },
      ],
    };
  },
  component: Home,
});

function Home() {
  const { annonser: initial, total: initialTotal } = Route.useLoaderData();
  const { annonser, total, loading, error } = useAnnonser({
    filter: {},
    sort: "relevans",
    sida: 1,
    perSida: 6,
  });
  // Visa loader-data som SSR-fallback tills klient-hooken laddat
  const featured = annonser.length > 0 ? annonser : initial;
  const totalCount = total || initialTotal;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-soft)" }}
        />
        <div
          className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-hero)" }}
        />

        <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 md:pb-24 md:pt-24">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Lediga annonser uppdaterade dagligen
            </div>
          </div>
          <h1 className="text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Hitta din nästa{" "}
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              hyresbostad
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-base text-muted-foreground md:text-lg">
            Vi samlar lediga hyreslägenheter från MKB och fler hyresvärdar — så
            du slipper leta på flera sajter.
          </p>

          <div className="mx-auto mt-10 max-w-3xl">
            <SearchBar />
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {totalCount > 0 ? `${totalCount} aktiva annonser` : "Laddar…"}
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Flera källor på ett ställe
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Senaste annonserna
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ett urval av nya bostäder
            </p>
          </div>
        </div>

        {error && !loading && featured.length === 0 && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Kunde inte hämta annonser: {error}
          </div>
        )}

        {featured.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <AnnonsCard key={a.id} annons={a} />
            ))}
          </div>
        )}

        {loading && featured.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Laddar annonser…
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} HomeFinder — Sveriges hyresmarknad samlad
      </footer>
    </div>
  );
}
