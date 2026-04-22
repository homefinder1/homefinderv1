import { MapPin, BedDouble, Calendar, ExternalLink, Ruler, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Annons } from "@/data/listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniMap } from "@/components/MiniMap";

// Färgkodade källbadges enligt stilguiden
const sourceColors: Record<string, string> = {
  MKB: "bg-blue-100 text-blue-900",
  HomeQ: "bg-emerald-100 text-emerald-900",
  "Boplats Väst": "bg-orange-100 text-orange-900",
  "Boplats Syd": "bg-purple-100 text-purple-900",
  Privat: "bg-pink-100 text-pink-900",
  Blocket: "bg-yellow-100 text-yellow-900",
  Qasa: "bg-teal-100 text-teal-900",
  Bostadsdirekt: "bg-amber-100 text-amber-900",
};

type DatumStatus =
  | { typ: "dölj" }
  | { typ: "nu" }
  | { typ: "framtid"; text: string };

function tolkaLedigDatum(d: string | undefined | null): DatumStatus {
  if (!d) return { typ: "dölj" };
  const date = new Date(d);
  if (isNaN(date.getTime())) return { typ: "dölj" };
  // Dölj epoch / 1970-datum
  if (date.getUTCFullYear() <= 1970) return { typ: "dölj" };

  // Jämför endast datum, inte tid
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  const datumUtanTid = new Date(date);
  datumUtanTid.setHours(0, 0, 0, 0);

  if (datumUtanTid.getTime() <= idag.getTime()) return { typ: "nu" };

  return {
    typ: "framtid",
    text: date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

function ärNy(annons: Annons): boolean {
  const referens = annons.skapad ?? annons.ledig;
  if (!referens) return false;
  const d = new Date(referens);
  if (isNaN(d.getTime())) return false;
  const timmar = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  return timmar >= 0 && timmar <= 24;
}

export function AnnonsCard({ annons }: { annons: Annons }) {
  const mapQuery = [annons.område, annons.titel].filter(Boolean).join(", ") || annons.titel;
  const ny = ärNy(annons);
  const datumStatus = tolkaLedigDatum(annons.ledig);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-elegant)]">
      {ny && (
        <div className="absolute left-3 top-3 z-10">
          <Badge className="gap-1 border-0 bg-emerald-500 text-white shadow-md">
            <Sparkles className="h-3 w-3" />
            NY
          </Badge>
        </div>
      )}
      <MiniMap query={mapQuery} className="h-32 w-full border-b border-border" />
      <div className="flex-1 space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold leading-tight text-foreground sm:text-lg">
              {annons.titel}
            </h3>
            {annons.område && annons.område.trim().toLowerCase() !== annons.titel.trim().toLowerCase() && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{annons.område}</span>
              </div>
            )}
          </div>
          <Badge
            className={`shrink-0 border-0 text-xs ${sourceColors[annons.källa] ?? "bg-secondary text-secondary-foreground"}`}
          >
            {annons.källa}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground">{annons.antal_rum}</span>
          </div>
          {annons.storlek && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ruler className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground">{annons.storlek}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Hyra</span>
            <span className="font-semibold text-foreground text-right">{annons.hyra}</span>
          </div>
          {datumStatus.typ !== "dölj" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                {datumStatus.typ === "nu" ? "Ledig nu" : `Ledig ${datumStatus.text}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-3 sm:p-4">
        {annons.källa === "Privat" ? (
          <Button asChild size="lg" className="h-12 w-full gap-2 text-base sm:h-10 sm:text-sm">
            <Link
              to="/annons/$id"
              params={{ id: annons.id.replace(/^privat-/, "") }}
            >
              Visa annons
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="h-12 w-full gap-2 text-base sm:h-10 sm:text-sm">
            <a href={annons.url} target="_blank" rel="noopener noreferrer">
              Visa annons
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
