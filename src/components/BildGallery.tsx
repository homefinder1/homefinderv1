import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BildGalleryProps {
  bilder: string[];
  alt: string;
  className?: string;
}

/**
 * Enkelt mobile-first bildgallery med swipe (snap), pilar på desktop och prick-indikator.
 */
export function BildGallery({ bilder, alt, className }: BildGalleryProps) {
  const [aktiv, setAktiv] = useState(0);
  const antal = bilder.length;

  if (antal === 0) return null;

  function gå(till: number) {
    const ny = ((till % antal) + antal) % antal;
    setAktiv(ny);
    const el = document.getElementById(`gallery-bild-${ny}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className={cn("relative bg-muted", className)}>
      <div
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        onScroll={(e) => {
          const target = e.currentTarget;
          const idx = Math.round(target.scrollLeft / target.clientWidth);
          if (idx !== aktiv && idx >= 0 && idx < antal) setAktiv(idx);
        }}
      >
        {bilder.map((src, i) => (
          <div
            key={src}
            id={`gallery-bild-${i}`}
            className="h-full w-full shrink-0 snap-start"
          >
            <img
              src={src}
              alt={`${alt} – bild ${i + 1} av ${antal}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {antal > 1 && (
        <>
          <button
            type="button"
            aria-label="Föregående bild"
            onClick={() => gå(aktiv - 1)}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md transition hover:bg-background sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Nästa bild"
            onClick={() => gå(aktiv + 1)}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md transition hover:bg-background sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1.5 backdrop-blur">
            {bilder.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Gå till bild ${i + 1}`}
                onClick={() => gå(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === aktiv ? "w-5 bg-foreground" : "w-1.5 bg-foreground/40",
                )}
              />
            ))}
          </div>

          <div className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
            {aktiv + 1} / {antal}
          </div>
        </>
      )}
    </div>
  );
}
