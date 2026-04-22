import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Ruler,
  User,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniMap } from "@/components/MiniMap";
import { supabase } from "@/integrations/supabase/client";

interface PrivatAnnons {
  id: string;
  titel: string;
  omrade: string | null;
  antal_rum: number | null;
  hyra: string | null;
  beskrivning: string | null;
  kontakt_namn: string | null;
  kontakt_email: string;
  kontakt_telefon: string | null;
  skapad_datum: string;
}

interface SimilarRow {
  id: string;
  titel: string;
  omrade: string | null;
  antal_rum: number | null;
  hyra: string | null;
  kontakt_namn: string | null;
}

async function laddaAnnons(id: string): Promise<PrivatAnnons | null> {
  const { data, error } = await supabase
    .from("annonser")
    .select(
      "id, titel, omrade, antal_rum, hyra, beskrivning, kontakt_namn, kontakt_email, kontakt_telefon, skapad_datum",
    )
    .eq("id", id)
    .eq("status", "godkand")
    .maybeSingle();
  if (error) throw error;
  return data;
}

function parsaHyra(s: string | null): number | null {
  if (!s) return null;
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export const Route = createFileRoute("/annons/$id")({
  loader: async ({ params }) => {
    const annons = await laddaAnnons(params.id);
    if (!annons) throw notFound();
    return { annons };
  },
  head: ({ loaderData }) => {
    const titel = loaderData?.annons?.titel ?? "Annons";
    const omrade = loaderData?.annons?.omrade ?? "";
    const desc = loaderData?.annons?.beskrivning?.slice(0, 155) ??
      `Hyresbostad ${omrade ? "i " + omrade : ""} på HomeFinder.`;
    return {
      meta: [
        { title: `${titel} — HomeFinder` },
        { name: "description", content: desc },
        { property: "og:title", content: `${titel} — HomeFinder` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
      ],
    };
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Något gick fel</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button
            className="mt-6"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Försök igen
          </Button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Annonsen finns inte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Den här annonsen är borttagen eller inte längre tillgänglig.
        </p>
        <Button asChild className="mt-6">
          <Link to="/sok">Tillbaka till sök</Link>
        </Button>
      </div>
    </div>
  ),
  component: AnnonsDetalj,
});

function AnnonsDetalj() {
  const { annons } = Route.useLoaderData();
  const router = useRouter();
  const [liknande, setLiknande] = useState<SimilarRow[]>([]);

  const mapQuery = [annons.omrade, annons.titel].filter(Boolean).join(", ") || annons.titel;
  const hyraNum = parsaHyra(annons.hyra);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      // Hämta liknande privata annonser med kontakt_namn
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as any)
        .from("annonser")
        .select("id, titel, omrade, antal_rum, hyra, kontakt_namn")
        .eq("status", "godkand")
        .neq("id", annons.id)
        .limit(3);

      if (annons.antal_rum != null) {
        q = q.eq("antal_rum", annons.antal_rum);
      }
      if (annons.omrade) {
        const ort = annons.omrade.replace(/[%,]/g, "").split(/\s+/)[0];
        if (ort) q = q.ilike("omrade", `%${ort}%`);
      }

      const { data } = await q;
      if (!aktiv) return;
      let rader = (data ?? []) as SimilarRow[];

      // Filtrera på hyra ±1000 kr i klienten
      if (hyraNum != null) {
        rader = rader.filter((r) => {
          const h = parsaHyra(r.hyra);
          return h == null || Math.abs(h - hyraNum) <= 1000;
        });
      }

      setLiknande(rader.slice(0, 3));
    })();
    return () => {
      aktiv = false;
    };
  }, [annons.id, annons.omrade, annons.antal_rum, hyraNum]);

  const inflyttning = new Date(annons.skapad_datum).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5 -ml-2"
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>

        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <MiniMap query={mapQuery} className="h-56 w-full border-b border-border sm:h-72" />

          <div className="space-y-6 p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge className="mb-2 border-0 bg-pink-100 text-pink-900">Privat</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {annons.titel}
                </h1>
                {annons.omrade && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{annons.omrade}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Hyra</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {annons.hyra ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rum</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-foreground">
                  <BedDouble className="h-4 w-4 text-primary" />
                  {annons.antal_rum ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Yta</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-foreground">
                  <Ruler className="h-4 w-4 text-primary" />
                  —
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Inlagd</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  {inflyttning}
                </p>
              </div>
            </div>

            {annons.beskrivning && (
              <div>
                <h2 className="text-lg font-semibold text-foreground">Beskrivning</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {annons.beskrivning}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-border bg-background p-5">
              <h2 className="text-lg font-semibold text-foreground">Kontakta hyresvärden</h2>
              <div className="mt-4 space-y-2 text-sm">
                {annons.kontakt_namn && (
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    <span>{annons.kontakt_namn}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <a
                    href={`mailto:${annons.kontakt_email}?subject=${encodeURIComponent("Intresseanmälan: " + annons.titel)}`}
                    className="text-primary hover:underline break-all"
                  >
                    {annons.kontakt_email}
                  </a>
                </div>
                {annons.kontakt_telefon && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${annons.kontakt_telefon}`} className="text-primary hover:underline">
                      {annons.kontakt_telefon}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="h-12 flex-1 gap-2 text-base">
                  <a
                    href={`mailto:${annons.kontakt_email}?subject=${encodeURIComponent("Intresseanmälan: " + annons.titel)}`}
                  >
                    <Mail className="h-4 w-4" />
                    Skicka mail
                  </a>
                </Button>
                {annons.kontakt_telefon && (
                  <Button asChild variant="outline" size="lg" className="h-12 flex-1 gap-2 text-base">
                    <a href={`tel:${annons.kontakt_telefon}`}>
                      <Phone className="h-4 w-4" />
                      Ring
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {liknande.length > 0 && (
              <section className="border-t border-border pt-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Du kanske gillar dessa också
                </h2>
                <div className="mt-4 -mx-5 sm:-mx-8 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
                  <div className="flex gap-4 px-5 sm:px-8">
                    {liknande.map((l) => (
                      <Link
                        key={l.id}
                        to="/annons/$id"
                        params={{ id: l.id }}
                        className="group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30 sm:w-[280px]"
                      >
                        <MiniMap
                          query={[l.omrade, l.titel].filter(Boolean).join(", ") || l.titel}
                          className="h-28 w-full border-b border-border"
                        />
                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                            {l.titel}
                          </h3>
                          {l.omrade && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{l.omrade}</span>
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <BedDouble className="h-3 w-3" />
                              {l.antal_rum ?? "—"} rum
                            </span>
                            <span className="font-semibold text-foreground">
                              {l.hyra ?? "—"}
                            </span>
                          </div>
                          {l.kontakt_namn && (
                            <p className="flex items-center gap-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{l.kontakt_namn}</span>
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
