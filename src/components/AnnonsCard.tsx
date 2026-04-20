import { MapPin, BedDouble, Calendar, ExternalLink, Ruler } from "lucide-react";
import type { Annons } from "@/data/listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniMap } from "@/components/MiniMap";

const sourceColors: Record<string, string> = {
  MKB: "bg-sky-100 text-sky-900",
  Blocket: "bg-yellow-100 text-yellow-900",
  Qasa: "bg-emerald-100 text-emerald-900",
  HomeQ: "bg-violet-100 text-violet-900",
  Bostadsdirekt: "bg-orange-100 text-orange-900",
  Privat: "bg-pink-100 text-pink-900",
};

function formateraDatum(d: string) {
  // Förväntar "YYYY-MM-DD" — visa snyggt på svenska, fallback till råtext
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AnnonsCard({ annons }: { annons: Annons }) {
  const mapQuery = [annons.område, annons.titel].filter(Boolean).join(", ") || annons.titel;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      <MiniMap query={mapQuery} className="h-32 w-full border-b border-border" />
      <div className="flex-1 space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground">
              {annons.titel}
            </h3>
            {annons.område && annons.område.trim().toLowerCase() !== annons.titel.trim().toLowerCase() && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{annons.område}</span>
              </div>
            )}
          </div>
          <Badge
            className={`shrink-0 border-0 ${sourceColors[annons.källa] ?? "bg-secondary text-secondary-foreground"}`}
          >
            {annons.källa}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4 text-primary" />
            <span className="text-foreground">{annons.antal_rum}</span>
          </div>
          {annons.storlek && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-foreground">{annons.storlek}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Hyra</span>
            <span className="font-semibold text-foreground">{annons.hyra}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Ledig {formateraDatum(annons.ledig)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <Button asChild className="w-full gap-2">
          <a href={annons.url} target="_blank" rel="noopener noreferrer">
            Visa annons
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </article>
  );
}
