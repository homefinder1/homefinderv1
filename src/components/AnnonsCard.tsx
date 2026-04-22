import { MapPin, BedDouble, Calendar, ExternalLink, Ruler, Sparkles, Heart, Share2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Annons } from "@/data/listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniMap } from "@/components/MiniMap";
import { useFavorit } from "@/hooks/useFavorit";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Facebook, MessageCircle, Mail, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  if (date.getUTCFullYear() <= 1970) return { typ: "dölj" };

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
  const förstaBild = annons.bilder && annons.bilder.length > 0 ? annons.bilder[0] : null;

  const { user } = useAuth();
  const { isFavorit, toggle, loading: favLoading } = useFavorit(annons.id);
  const [authOpen, setAuthOpen] = useState(false);
  const [kopierad, setKopierad] = useState(false);

  // URL för delning — privata pekar på vår sida, övriga på extern URL
  const isPrivat = annons.källa === "Privat";
  const detaljUrl = isPrivat
    ? `https://homefinder.se/annons/${annons.id.replace(/^privat-/, "")}`
    : annons.url;

  function handleHjarta(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    toggle();
  }

  async function kopieraLank(e: Event) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(detaljUrl);
      setKopierad(true);
      toast.success("Länk kopierad!");
      setTimeout(() => setKopierad(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  }

  const delaText = `Kolla in den här bostaden: ${annons.titel}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(detaljUrl)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(delaText + " " + detaljUrl)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(annons.titel)}&body=${encodeURIComponent(delaText + "\n\n" + detaljUrl)}`;

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

      {/* Favorit + Dela uppe i högra hörnet — fungerar för ALLA annonser */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleHjarta}
          disabled={favLoading}
          aria-label={isFavorit ? "Ta bort från favoriter" : "Spara som favorit"}
          aria-pressed={isFavorit}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-colors hover:bg-background",
            isFavorit ? "text-red-600" : "text-foreground/70 hover:text-red-600",
          )}
        >
          <Heart className={cn("h-4 w-4 transition-all", isFavorit && "fill-current")} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Dela annons"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-blue-600 shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-blue-700"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem asChild>
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={mailUrl} className="cursor-pointer">
                <Mail className="mr-2 h-4 w-4" />
                E-post
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={kopieraLank} className="cursor-pointer">
              {kopierad ? (
                <Check className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {kopierad ? "Kopierat!" : "Kopiera länk"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {förstaBild ? (
        <div className="h-32 w-full overflow-hidden border-b border-border bg-muted">
          <img
            src={förstaBild}
            alt={annons.titel}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <MiniMap query={mapQuery} className="h-32 w-full border-b border-border" />
      )}
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
        {isPrivat ? (
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

      <AuthRequiredDialog open={authOpen} onOpenChange={setAuthOpen} />
    </article>
  );
}
