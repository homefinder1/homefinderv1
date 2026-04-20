import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AnnonsCard } from "@/components/AnnonsCard";
import { Button } from "@/components/ui/button";
import {
  FilterBar,
  TOMMA_FILTER,
  tillämpaFilter,
  type Filters,
} from "@/components/FilterBar";
import { useAnnonser } from "@/hooks/useAnnonser";
import { useBreakpoint } from "@/hooks/useBreakpoint";

interface SearchParams extends Partial<Filters> {
  q?: string;
  sida?: number;
}

// Antal kolumner per breakpoint — används för att fylla rutnätet jämnt
const KOLUMNER = { mobile: 1, tablet: 2, desktop: 3 } as const;
// Antal rader per sida — ger jämna rutnät: mobil 6, tablet 8, desktop 9
const RADER = { mobile: 6, tablet: 4, desktop: 3 } as const;

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

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
    sida: num(search.sida),
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
  const bp = useBreakpoint();
  const kolumner = KOLUMNER[bp];
  const perSida = kolumner * RADER[bp];

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
    const cleaned: Record<string, string | number | undefined> = {
      q: undefined,
      ort: next.ort || undefined,
      ytaMin: next.ytaMin || undefined,
      ytaMax: next.ytaMax || undefined,
      hyraMin: next.hyraMin || undefined,
      hyraMax: next.hyraMax || undefined,
      rum: next.rum !== "alla" ? next.rum : undefined,
      källa: next.källa !== "alla" ? next.källa : undefined,
      ledig: next.ledig !== "alla" ? next.ledig : undefined,
      sida: undefined,
    };
    navigate({ search: cleaned, replace: true });
  };

  const results = useMemo(
    () => tillämpaFilter(annonser, filters),
    [annonser, filters],
  );

  const sida = search.sida ?? 1;

  // Bygg sidor som alltid fyller hela rader (aldrig en ensam annons på sista raden,
  // utom när det totala antalet är mindre än kolumner)
  const sidStartIndex = useMemo(() => {
    const starter: number[] = [];
    let i = 0;
    while (i < results.length) {
      starter.push(i);
      let nästa = i + perSida;
      // Om resten efter denna sida är mindre än en hel rad → ta med dem på denna sida
      const kvar = results.length - nästa;
      if (kvar > 0 && kvar < kolumner) nästa = results.length;
      i = nästa;
    }
    if (starter.length === 0) starter.push(0);
    return starter;
  }, [results.length, perSida, kolumner]);

  const totalSidor = sidStartIndex.length;
  const aktuellSida = Math.min(Math.max(1, sida), totalSidor);
  const start = sidStartIndex[aktuellSida - 1];
  const slut = sidStartIndex[aktuellSida] ?? results.length;
  const sidResultat = results.slice(start, slut);

  const gåTillSida = (n: number) => {
    navigate({
      search: (prev: SearchParams) => ({ ...prev, sida: n > 1 ? n : undefined }),
      replace: false,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sidResultat.map((a) => (
                <AnnonsCard key={a.id} annons={a} />
              ))}
            </div>

            {totalSidor > 1 && (
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Sida {aktuellSida} av {totalSidor}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gåTillSida(aktuellSida - 1)}
                    disabled={aktuellSida <= 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Föregående
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gåTillSida(aktuellSida + 1)}
                    disabled={aktuellSida >= totalSidor}
                  >
                    Nästa
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
