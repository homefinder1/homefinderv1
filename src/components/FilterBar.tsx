import { Calendar as CalendarIcon, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface Filters {
  ort: string;
  ytaMin: string;
  ytaMax: string;
  hyraMin: string;
  hyraMax: string;
  rum: string;
  källa: string;
  ledig: string;
}

export const TOMMA_FILTER: Filters = {
  ort: "",
  ytaMin: "",
  ytaMax: "",
  hyraMin: "",
  hyraMax: "",
  rum: "alla",
  källa: "alla",
  ledig: "alla",
};

const STÄDER = [
  "Stockholm",
  "Göteborg",
  "Malmö",
  "Uppsala",
  "Lund",
  "Linköping",
  "Västerås",
  "Örebro",
  "Helsingborg",
  "Norrköping",
  "Jönköping",
  "Umeå",
];

const KÄLLOR = ["MKB", "Boplats Väst", "Boplats Syd", "HomeQ", "Privat"];

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const harAktivaFilter =
    filters.ort !== "" ||
    filters.ytaMin !== "" ||
    filters.ytaMax !== "" ||
    filters.hyraMin !== "" ||
    filters.hyraMax !== "" ||
    filters.rum !== "alla" ||
    filters.källa !== "alla" ||
    filters.ledig !== "alla";

  const inputClass = "h-12 text-base md:h-10 md:text-sm";
  const triggerClass = "h-12 text-base md:h-10 md:text-sm";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)] md:rounded-3xl md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtrera bostäder
        </div>
        {harAktivaFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange(TOMMA_FILTER)}
          >
            <X className="h-3.5 w-3.5" />
            Rensa
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Ort */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-ort" className="text-xs text-muted-foreground">
            Stad / Område
          </Label>
          <Input
            id="filter-ort"
            list="filter-städer"
            placeholder="t.ex. Stockholm"
            value={filters.ort}
            onChange={(e) => update("ort", e.target.value)}
            className="h-10"
          />
          <datalist id="filter-städer">
            {STÄDER.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Antal rum */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Antal rum</Label>
          <Select value={filters.rum} onValueChange={(v) => update("rum", v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Alla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla</SelectItem>
              <SelectItem value="1">1 rum</SelectItem>
              <SelectItem value="2">2 rum</SelectItem>
              <SelectItem value="3">3 rum</SelectItem>
              <SelectItem value="4">4 rum</SelectItem>
              <SelectItem value="5">5+ rum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Källa */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Källa</Label>
          <Select
            value={filters.källa}
            onValueChange={(v) => update("källa", v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Alla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla källor</SelectItem>
              {KÄLLOR.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Yta */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Yta (m²)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              value={filters.ytaMin}
              onChange={(e) => update("ytaMin", e.target.value)}
              className="h-10"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={filters.ytaMax}
              onChange={(e) => update("ytaMax", e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* Hyra */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hyra (kr/mån)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              value={filters.hyraMin}
              onChange={(e) => update("hyraMin", e.target.value)}
              className="h-10"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={filters.hyraMax}
              onChange={(e) => update("hyraMax", e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* Ledig från */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ledig från</Label>
          <Select
            value={filters.ledig}
            onValueChange={(v) => update("ledig", v)}
          >
            <SelectTrigger className="h-10">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Alla" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla</SelectItem>
              <SelectItem value="nu">Nu (redan ledig)</SelectItem>
              <SelectItem value="1m">Inom 1 månad</SelectItem>
              <SelectItem value="3m">Inom 3 månader</SelectItem>
              <SelectItem value="3m+">Efter 3 månader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* ---------- Filter-logik ---------- */

function parsaTal(s: string): number | null {
  if (!s) return null;
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function rumTal(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}

export function tillämpaFilter<
  T extends {
    titel: string;
    område: string;
    antal_rum: string;
    storlek?: string;
    hyra: string;
    ledig: string;
    källa: string;
  },
>(annonser: T[], f: Filters): T[] {
  const ort = f.ort.trim().toLowerCase();
  const ytaMin = parsaTal(f.ytaMin);
  const ytaMax = parsaTal(f.ytaMax);
  const hyraMin = parsaTal(f.hyraMin);
  const hyraMax = parsaTal(f.hyraMax);
  const nu = new Date();
  nu.setHours(0, 0, 0, 0);

  return annonser.filter((a) => {
    if (ort) {
      const haystack = `${a.område} ${a.titel}`.toLowerCase();
      if (!haystack.includes(ort)) return false;
    }

    if (f.källa !== "alla" && a.källa !== f.källa) return false;

    if (f.rum !== "alla") {
      const rum = rumTal(a.antal_rum);
      if (rum == null) return false;
      if (f.rum === "5") {
        if (rum < 5) return false;
      } else {
        if (Math.floor(rum) !== parseInt(f.rum, 10)) return false;
      }
    }

    if (ytaMin != null || ytaMax != null) {
      const yta = parsaTal(a.storlek ?? "");
      if (yta == null) return false;
      if (ytaMin != null && yta < ytaMin) return false;
      if (ytaMax != null && yta > ytaMax) return false;
    }

    if (hyraMin != null || hyraMax != null) {
      const hyra = parsaTal(a.hyra);
      if (hyra == null) return false;
      if (hyraMin != null && hyra < hyraMin) return false;
      if (hyraMax != null && hyra > hyraMax) return false;
    }

    if (f.ledig !== "alla") {
      const d = new Date(a.ledig);
      if (isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      if (f.ledig === "nu") {
        if (d > nu) return false;
      } else if (f.ledig === "1m") {
        const grans = new Date(nu);
        grans.setMonth(grans.getMonth() + 1);
        if (d > grans) return false;
      } else if (f.ledig === "3m") {
        const grans = new Date(nu);
        grans.setMonth(grans.getMonth() + 3);
        if (d > grans) return false;
      } else if (f.ledig === "3m+") {
        const grans = new Date(nu);
        grans.setMonth(grans.getMonth() + 3);
        if (d <= grans) return false;
      }
    }

    return true;
  });
}
