import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CITIES, LISTINGS, SOURCES, type Source } from "@/data/listings";

interface SearchParams {
  city?: string;
  maxPrice?: string;
  rooms?: string;
}

export const Route = createFileRoute("/sok")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    city: typeof search.city === "string" ? search.city : undefined,
    maxPrice: typeof search.maxPrice === "string" ? search.maxPrice : undefined,
    rooms: typeof search.rooms === "string" ? search.rooms : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sök hyresbostäder — HomeFinder" },
      {
        name: "description",
        content:
          "Filtrera hyresannonser efter stad, pris, storlek och källa.",
      },
      { property: "og:title", content: "Sök hyresbostäder — HomeFinder" },
      {
        property: "og:description",
        content: "Hitta lediga hyreslägenheter över hela Sverige.",
      },
    ],
  }),
  component: SearchPage,
});

function FilterPanel({
  city,
  setCity,
  priceRange,
  setPriceRange,
  sizeRange,
  setSizeRange,
  selectedSources,
  toggleSource,
}: {
  city: string;
  setCity: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  sizeRange: [number, number];
  setSizeRange: (v: [number, number]) => void;
  selectedSources: Source[];
  toggleSource: (s: Source) => void;
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Label>Stad</Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Pris (kr/mån)</Label>
          <span className="text-xs text-muted-foreground">
            {priceRange[0].toLocaleString("sv-SE")}–
            {priceRange[1].toLocaleString("sv-SE")}
          </span>
        </div>
        <Slider
          value={priceRange}
          min={0}
          max={25000}
          step={500}
          onValueChange={(v) => setPriceRange(v as [number, number])}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Storlek (m²)</Label>
          <span className="text-xs text-muted-foreground">
            {sizeRange[0]}–{sizeRange[1]} m²
          </span>
        </div>
        <Slider
          value={sizeRange}
          min={0}
          max={150}
          step={5}
          onValueChange={(v) => setSizeRange(v as [number, number])}
        />
      </div>

      <div className="space-y-3">
        <Label>Källa</Label>
        <div className="space-y-2">
          {SOURCES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedSources.includes(s)}
                onCheckedChange={() => toggleSource(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchPage() {
  const params = Route.useSearch();
  const [city, setCity] = useState<string>(params.city ?? "Alla städer");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    params.maxPrice ? Number(params.maxPrice) : 25000,
  ]);
  const [sizeRange, setSizeRange] = useState<[number, number]>([0, 150]);
  const [selectedSources, setSelectedSources] = useState<Source[]>([
    ...SOURCES,
  ]);

  const toggleSource = (s: Source) =>
    setSelectedSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const minRooms = params.rooms ? Number(params.rooms) : 0;

  const results = useMemo(() => {
    return LISTINGS.filter((l) => {
      if (city !== "Alla städer" && l.city !== city) return false;
      if (l.price < priceRange[0] || l.price > priceRange[1]) return false;
      if (l.size < sizeRange[0] || l.size > sizeRange[1]) return false;
      if (!selectedSources.includes(l.source)) return false;
      if (minRooms && l.rooms < minRooms) return false;
      return true;
    });
  }, [city, priceRange, sizeRange, selectedSources, minRooms]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SearchBar variant="compact" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {results.length} bostäder
            </h1>
            <p className="text-sm text-muted-foreground">
              {city !== "Alla städer" ? `i ${city}` : "i hela Sverige"}
            </p>
          </div>

          {/* Mobile filter trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-6">
              <SheetHeader className="mb-6 p-0">
                <SheetTitle>Filter</SheetTitle>
              </SheetHeader>
              <FilterPanel
                city={city}
                setCity={setCity}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sizeRange={sizeRange}
                setSizeRange={setSizeRange}
                selectedSources={selectedSources}
                toggleSource={toggleSource}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Desktop filter */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Filter
              </h2>
              <FilterPanel
                city={city}
                setCity={setCity}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sizeRange={sizeRange}
                setSizeRange={setSizeRange}
                selectedSources={selectedSources}
                toggleSource={toggleSource}
              />
            </div>
          </aside>

          <div>
            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">
                  Inga bostäder matchar dina filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {results.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
