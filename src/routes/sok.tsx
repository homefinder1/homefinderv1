import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AnnonsCard } from "@/components/AnnonsCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterBar,
  TOMMA_FILTER,
  tillämpaFilter,
  type Filters,
} from "@/components/FilterBar";
import { useAnnonser } from "@/hooks/useAnnonser";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { Annons } from "@/data/listings";

type SortVal =
  | "relevans"
  | "hyra-asc"
  | "hyra-desc"
  | "yta-asc"
  | "yta-desc"
  | "ledig-asc";

const SORT_ALTERNATIV: { value: SortVal; label: string }[] = [
  { value: "relevans", label: "Relevans" },
  { value: "hyra-asc", label: "Lägst hyra" },
  { value: "hyra-desc", label: "Högst hyra" },
  { value: "yta-asc", label: "Minst yta" },
  { value: "yta-desc", label: "Störst yta" },
  { value: "ledig-asc", label: "Nyast ledig" },
];

interface SearchParams extends Partial<Filters> {
  q?: string;
  sida?: number;
  sort?: SortVal;
}

// Antal kolumner per breakpoint — används för att fylla rutnätet jämnt
const KOLUMNER = { mobile: 1, tablet: 2, desktop: 3 } as const;
// Antal rader per sida — desktop 5×3=15, tablet 5×2=10, mobil 6×1=6
const RADER = { mobile: 6, tablet: 5, desktop: 5 } as const;

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const sortVal = (v: unknown): SortVal | undefined => {
  if (typeof v !== "string") return undefined;
  return SORT_ALTERNATIV.some((s) => s.value === v) ? (v as SortVal) : undefined;
};

function parsaTal(s: string | undefined): number | null {
  if (!s) return null;
  const trimmed = s.trim().toLowerCase();
  if (!trimmed || trimmed === "okänd" || trimmed === "okand") return null;
  const n = parseInt(trimmed.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Jämför tal där null alltid hamnar sist, oavsett asc/desc */
function jämförMedNullSist(a: number | null, b: number | null, riktning: "asc" | "desc"): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return 1 * 0 - 1 + 2; // = 1, men behåll explicit nedan
  // Förenkling: hantera separat
  return 0;
}

function cmpNullSist(a: number | null, b: number | null, riktning: "asc" | "desc"): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return riktning === "asc" ? a - b : b - a;
}

function sorteraAnnonser(list: Annons[], sort: SortVal): Annons[] {
  if (sort === "relevans") return list;
  const out = [...list];
  switch (sort) {
    case "hyra-asc":
      out.sort((a, b) => cmpNullSist(parsaTal(a.hyra), parsaTal(b.hyra), "asc"));
      break;
    case "hyra-desc":
      out.sort((a, b) => cmpNullSist(parsaTal(a.hyra), parsaTal(b.hyra), "desc"));
      break;
    case "yta-asc":
      out.sort((a, b) => cmpNullSist(parsaTal(a.storlek), parsaTal(b.storlek), "asc"));
      break;
    case "yta-desc":
      out.sort((a, b) => cmpNullSist(parsaTal(a.storlek), parsaTal(b.storlek), "desc"));
      break;
    case "ledig-asc":
      out.sort((a, b) => {
        const da = new Date(a.ledig).getTime();
        const db = new Date(b.ledig).getTime();
        return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity);
      });
      break;
  }
  return out;
}

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
    sort: sortVal(search.sort),
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

  const sort: SortVal = search.sort ?? "relevans";

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
      sort: sort !== "relevans" ? sort : undefined,
      sida: undefined,
    };
    navigate({ search: cleaned, replace: true });
  };

  const handleSort = (v: string) => {
    const next = v as SortVal;
    navigate({
      search: (prev: SearchParams) => ({
        ...prev,
        sort: next !== "relevans" ? next : undefined,
        sida: undefined,
      }),
      replace: true,
    });
  };

  const filtered = useMemo(
    () => tillämpaFilter(annonser, filters),
    [annonser, filters],
  );

  const results = useMemo(
    () => sorteraAnnonser(filtered, sort),
    [filtered, sort],
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {loading ? "Laddar…" : `${results.length} bostäder`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {results.length === annonser.length
                ? "Alla lediga annonser"
                : "Filtrerat resultat"}
            </p>
          </div>

          {!loading && !error && results.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-muted-foreground">Sortera:</span>
              <Select value={sort} onValueChange={handleSort}>
                <SelectTrigger className="h-9 w-[170px] border-0 bg-transparent px-2 font-medium text-foreground shadow-none hover:text-primary focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_ALTERNATIV.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sidResultat.map((a) => (
                <AnnonsCard key={a.id} annons={a} />
              ))}
            </div>

            {totalSidor > 1 && (
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Sida <span className="text-foreground">{aktuellSida}</span> av{" "}
                  <span className="text-foreground">{totalSidor}</span>
                </p>
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 flex-1 gap-2 text-base sm:flex-none sm:px-6"
                    onClick={() => gåTillSida(aktuellSida - 1)}
                    disabled={aktuellSida <= 1}
                    aria-label="Föregående sida"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Föregående
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    className="h-12 flex-1 gap-2 text-base sm:flex-none sm:px-6"
                    onClick={() => gåTillSida(aktuellSida + 1)}
                    disabled={aktuellSida >= totalSidor}
                    aria-label="Nästa sida"
                  >
                    Nästa
                    <ChevronRight className="h-5 w-5" />
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
