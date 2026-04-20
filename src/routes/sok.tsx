import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { AnnonsCard } from "@/components/AnnonsCard";
import {
  FilterBar,
  TOMMA_FILTER,
  tillämpaFilter,
  type Filters,
} from "@/components/FilterBar";
import { useAnnonser } from "@/hooks/useAnnonser";

interface SearchParams extends Partial<Filters> {
  q?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export const Route = createFileRoute("/sok")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: str(search.q),
    ort: str(search.ort),
    ytaMin: str(search.ytaMin),
    ytaMax: str(search.ytaMax),
    hyraMin: str(search.hyraMin),
    hyraMax: str(search.hyraMax),
    rum: str(search.rum),
    källa: str(search.källa),
    ledig: str(search.ledig),
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
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/sok" });
  const { annonser, loading, error } = useAnnonser();

  const filters: Filters = useMemo(
    () => ({
      ort: search.ort ?? search.q ?? TOMMA_FILTER.ort,
      ytaMin: search.ytaMin ?? TOMMA_FILTER.ytaMin,
      ytaMax: search.ytaMax ?? TOMMA_FILTER.ytaMax,
      hyraMin: search.hyraMin ?? TOMMA_FILTER.hyraMin,
      hyraMax: search.hyraMax ?? TOMMA_FILTER.hyraMax,
      rum: search.rum ?? TOMMA_FILTER.rum,
      källa: search.källa ?? TOMMA_FILTER.källa,
      ledig: search.ledig ?? TOMMA_FILTER.ledig,
    }),
    [search],
  );

  const handleChange = (next: Filters) => {
    const cleaned: Record<string, string | undefined> = {
      q: undefined,
      ort: next.ort || undefined,
      ytaMin: next.ytaMin || undefined,
      ytaMax: next.ytaMax || undefined,
      hyraMin: next.hyraMin || undefined,
      hyraMax: next.hyraMax || undefined,
      rum: next.rum !== "alla" ? next.rum : undefined,
      källa: next.källa !== "alla" ? next.källa : undefined,
      ledig: next.ledig !== "alla" ? next.ledig : undefined,
    };
    navigate({ search: cleaned, replace: true });
  };

  const results = useMemo(
    () => tillämpaFilter(annonser, filters),
    [annonser, filters],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <FilterBar filters={filters} onChange={handleChange} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {loading ? "Laddar…" : `${results.length} bostäder`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {results.length === annonser.length
              ? "Alla lediga annonser"
              : "Filtrerat resultat"}
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
              Inga bostäder matchar dina filter. Prova att rensa eller bredda
              sökningen.
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
