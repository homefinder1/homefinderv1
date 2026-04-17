import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { AnnonsCard } from "@/components/AnnonsCard";
import { useAnnonser } from "@/hooks/useAnnonser";

interface SearchParams {
  q?: string;
}

export const Route = createFileRoute("/sok")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sök hyresbostäder — HomeFinder" },
      {
        name: "description",
        content: "Bläddra bland lediga hyresannonser från MKB och fler källor.",
      },
      { property: "og:title", content: "Sök hyresbostäder — HomeFinder" },
      {
        property: "og:description",
        content: "Hitta lediga hyreslägenheter på ett ställe.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { annonser, loading, error } = useAnnonser();

  const results = useMemo(() => {
    if (!q) return annonser;
    const needle = q.toLowerCase();
    return annonser.filter((a) =>
      [a.titel, a.område, a.källa, a.antal_rum]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [q, annonser]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SearchBar variant="compact" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {loading ? "Laddar…" : `${results.length} bostäder`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {q ? `Sökning: "${q}"` : "Alla lediga annonser"}
          </p>
        </div>

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Kunde inte hämta annonser: {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Laddar annonser…
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              Inga bostäder matchar din sökning.
            </p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => (
              <AnnonsCard key={a.id} annons={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
