import { MapPin, Maximize2, BedDouble } from "lucide-react";
import type { Listing } from "@/data/listings";
import { Badge } from "@/components/ui/badge";

const sourceColors: Record<string, string> = {
  Blocket: "bg-yellow-100 text-yellow-900",
  Qasa: "bg-emerald-100 text-emerald-900",
  HomeQ: "bg-violet-100 text-violet-900",
  Bostadsdirekt: "bg-orange-100 text-orange-900",
};

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <a
      href={listing.url}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge
          className={`absolute left-3 top-3 border-0 ${sourceColors[listing.source] ?? "bg-secondary text-secondary-foreground"}`}
        >
          {listing.source}
        </Badge>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-foreground">
            {listing.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {listing.city}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {listing.rooms} rum
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" /> {listing.size} m²
            </span>
          </div>
          <div className="text-right">
            <div className="text-base font-semibold text-foreground">
              {listing.price.toLocaleString("sv-SE")} kr
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              per månad
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
