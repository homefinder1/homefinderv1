import { createFileRoute } from "@tanstack/react-router";
import { Building2, Search, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { AnnonsCard } from "@/components/AnnonsCard";
import { useAnnonser } from "@/hooks/useAnnonser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeFinder — Hitta din nästa hyresbostad" },
      {
        name: "description",
        content:
          "Sök hyreslägenheter från MKB, Blocket, Qasa, HomeQ och fler — allt på ett ställe.",
      },
      { property: "og:title", content: "HomeFinder — Hitta din nästa hyresbostad" },
      {
        property: "og:description",
        content: "Sveriges samlade hyresmarknad i en enda sökning.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { annonser, total, loading, error } = useAnnonser({
    filter: {},
    sort: "relevans",
    sida: 1,
    perSida: 6,
  });
  const featured = annonser;

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
              {loading ? "Laddar…" : `${total} aktiva annonser`}
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

        {loading && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Laddar annonser…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Kunde inte hämta annonser: {error}
          </div>
        )}

        {!loading && !error && featured.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <AnnonsCard key={a.id} annons={a} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} HomeFinder — Sveriges hyresmarknad samlad
      </footer>
    </div>
  );
}
