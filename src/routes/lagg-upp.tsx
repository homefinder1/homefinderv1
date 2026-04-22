import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, Loader2, ImagePlus, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { laddaUppBild } from "@/lib/imageUpload";
import { toast } from "sonner";

const MAX_BILDER = 5;
const MAX_FILSTORLEK_MB = 10;
const MAX_BESKRIVNING = 500;

interface LaggUppSearch {
  id?: string;
}

export const Route = createFileRoute("/lagg-upp")({
  validateSearch: (search: Record<string, unknown>): LaggUppSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Annonsera din hyresbostad gratis — HomeFinder" },
      {
        name: "description",
        content:
          "Lägg upp en annons för din hyresbostad gratis på HomeFinder och nå tusentals bostadssökande i hela Sverige.",
      },
      {
        property: "og:title",
        content: "Annonsera din hyresbostad gratis — HomeFinder",
      },
      {
        property: "og:description",
        content:
          "Lägg upp en annons för din hyresbostad gratis och nå tusentals bostadssökande i hela Sverige.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://homefinder.se/lagg-upp" }],
  }),
  component: PostListing,
});

interface ProfilData {
  fornamn: string;
  efternamn: string;
  telefon: string;
}

interface BefintligAnnons {
  id: string;
  titel: string;
  omrade: string | null;
  hyra: string | null;
  antal_rum: number | null;
  storlek_num: number | null;
  beskrivning: string | null;
  ledig_datum: string | null;
  kontakt_namn: string | null;
  kontakt_telefon: string | null;
  bilder: string[] | null;
}

function PostListing() {
  const navigate = useNavigate();
  const { id: editId } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [profilLoading, setProfilLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [ledigDatum, setLedigDatum] = useState<Date | undefined>(undefined);
  const [bilder, setBilder] = useState<Array<{ file: File; preview: string }>>([]);
  const [befintligaBilder, setBefintligaBilder] = useState<string[]>([]);
  const [beskrivning, setBeskrivning] = useState("");
  const [befintlig, setBefintlig] = useState<BefintligAnnons | null>(null);
  const [laddarAnnons, setLaddarAnnons] = useState(false);
  const filinputRef = useRef<HTMLInputElement | null>(null);
  const isEdit = !!editId;

  // Rensa preview URLs vid unmount
  useEffect(() => {
    return () => {
      bilder.forEach((b) => URL.revokeObjectURL(b.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!authLoading && !user) {
      setAuthDialogOpen(true);
    }
  }, [authLoading, user]);

  // Ladda profil när user finns
  useEffect(() => {
    if (!user) return;
    let aktiv = true;
    (async () => {
      setProfilLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("fornamn, efternamn, telefon")
        .eq("id", user.id)
        .maybeSingle();
      if (!aktiv) return;
      setProfil({
        fornamn: data?.fornamn ?? "",
        efternamn: data?.efternamn ?? "",
        telefon: data?.telefon ?? "",
      });
      setProfilLoading(false);
    })();
    return () => {
      aktiv = false;
    };
  }, [user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const fd = new FormData(form);

    const titel = String(fd.get("title") ?? "").trim();
    const omrade = String(fd.get("city") ?? "").trim();
    const hyraNum = String(fd.get("price") ?? "").trim();
    const rumRaw = Number(fd.get("rooms"));
    const antal_rum = Number.isFinite(rumRaw) && rumRaw >= 1 && rumRaw <= 10 ? Math.round(rumRaw) : null;
    const ytaRaw = Number(fd.get("yta"));
    const storlek_num = Number.isFinite(ytaRaw) && ytaRaw > 0 && ytaRaw <= 10000 ? ytaRaw : null;
    const beskrivningTrim = beskrivning.trim().slice(0, MAX_BESKRIVNING) || null;
    const fornamn = String(fd.get("fornamn") ?? "").trim();
    const efternamn = String(fd.get("efternamn") ?? "").trim();
    const telefon = String(fd.get("telefon") ?? "").trim();

    if (!titel) {
      toast.error("Adress/rubrik är obligatoriskt");
      return;
    }
    if (!omrade) {
      toast.error("Område är obligatoriskt");
      return;
    }
    if (!hyraNum) {
      toast.error("Hyra är obligatoriskt");
      return;
    }
    if (!fornamn) {
      toast.error("Förnamn är obligatoriskt");
      return;
    }

    setSubmitting(true);

    // Uppdatera profil om ändrad
    if (
      profil &&
      (profil.fornamn !== fornamn ||
        profil.efternamn !== efternamn ||
        profil.telefon !== telefon)
    ) {
      await supabase
        .from("profiles")
        .update({ fornamn, efternamn, telefon, uppdaterad_datum: new Date().toISOString() })
        .eq("id", user.id);
    }

    // Ladda upp bilder (komprimeras automatiskt)
    let bildUrls: string[] = [];
    if (bilder.length > 0) {
      try {
        bildUrls = await Promise.all(
          bilder.map((b) => laddaUppBild(b.file, user.id)),
        );
      } catch (err) {
        setSubmitting(false);
        toast.error(
          "Kunde inte ladda upp bild: " +
            (err instanceof Error ? err.message : "okänt fel"),
        );
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("annonser").insert({
      titel,
      omrade: omrade || null,
      antal_rum,
      storlek_num,
      hyra: hyraNum ? `${hyraNum} kr/mån` : null,
      beskrivning: beskrivningTrim,
      ledig_datum: ledigDatum ? format(ledigDatum, "yyyy-MM-dd") : null,
      kontakt_email: user.email ?? "",
      kontakt_namn: `${fornamn} ${efternamn}`.trim(),
      kontakt_telefon: telefon || null,
      kalla: "Privat",
      user_id: user.id,
      bilder: bildUrls.length > 0 ? bildUrls : null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Kunde inte publicera annonsen: " + error.message);
      return;
    }

    setSubmitted(true);
  }

  function läggTillBilder(filer: FileList | null) {
    if (!filer || filer.length === 0) return;
    const lediga = MAX_BILDER - bilder.length;
    if (lediga <= 0) {
      toast.error(`Du kan ladda upp max ${MAX_BILDER} bilder`);
      return;
    }
    const nya: Array<{ file: File; preview: string }> = [];
    for (const f of Array.from(filer).slice(0, lediga)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`"${f.name}" är inte en bild`);
        continue;
      }
      if (f.size > MAX_FILSTORLEK_MB * 1024 * 1024) {
        toast.error(`"${f.name}" är större än ${MAX_FILSTORLEK_MB} MB`);
        continue;
      }
      nya.push({ file: f, preview: URL.createObjectURL(f) });
    }
    if (nya.length > 0) setBilder((prev) => [...prev, ...nya]);
    if (filinputRef.current) filinputRef.current.value = "";
  }

  function taBortBild(idx: number) {
    setBilder((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Lägg upp annons
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Du behöver vara inloggad för att fortsätta.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => setAuthDialogOpen(true)}>
              Logga in
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate({ to: "/" })}>
              Tillbaka till startsidan
            </Button>
          </div>
        </div>
        <AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Lägg upp annons
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Nå tusentals bostadssökande — det är gratis.
        </p>

        {submitted ? (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Tack — annonsen är inskickad!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Din annons granskas av en moderator innan den publiceras på
                HomeFinder. Det brukar gå snabbt.
              </p>
            </div>
          </div>
        ) : profilLoading ? (
          <div className="mt-8 flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6"
          >
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">Adress / rubrik</Label>
              <Input id="title" name="title" placeholder="T.ex. Storgatan 5, Stockholm" required className="h-12 text-base" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">Område</Label>
                <Input id="city" name="city" placeholder="Södermalm" required className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm">Hyra (kr/mån)</Label>
                <Input id="price" name="price" type="number" inputMode="numeric" placeholder="9500" required className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rooms" className="text-sm flex items-center justify-between">
                  <span>Antal rum</span>
                  <span className="text-xs font-normal text-muted-foreground">Valfritt</span>
                </Label>
                <Input id="rooms" name="rooms" type="number" inputMode="numeric" min={1} max={10} step={1} placeholder="2" className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yta" className="text-sm flex items-center justify-between">
                  <span>Yta (m²)</span>
                  <span className="text-xs font-normal text-muted-foreground">Valfritt</span>
                </Label>
                <Input id="yta" name="yta" type="number" inputMode="numeric" min={1} max={10000} step={1} placeholder="65" className="h-12 text-base" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledig" className="text-sm flex items-center justify-between">
                <span>Ledig från</span>
                <span className="text-xs font-normal text-muted-foreground">Valfritt</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="ledig"
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-12 w-full justify-start text-left text-base font-normal",
                      !ledigDatum && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {ledigDatum ? format(ledigDatum, "d MMMM yyyy", { locale: sv }) : "Välj inflyttningsdatum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={ledigDatum}
                    onSelect={setLedigDatum}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  {ledigDatum && (
                    <div className="border-t border-border p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setLedigDatum(undefined)}
                      >
                        Rensa datum
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-sm flex items-center justify-between">
                <span>Beskrivning</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {beskrivning.length}/{MAX_BESKRIVNING}
                </span>
              </Label>
              <Textarea
                id="desc"
                name="desc"
                rows={5}
                value={beskrivning}
                onChange={(e) => setBeskrivning(e.target.value.slice(0, MAX_BESKRIVNING))}
                placeholder="Förbättra dina odds — beskriv vad som gör bostaden special (200–500 tecken)"
                className="min-h-[140px] text-base"
              />
              <p className="text-xs text-muted-foreground">Valfritt. Max {MAX_BESKRIVNING} tecken.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm flex items-center justify-between">
                <span>Bilder</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Valfritt — max {MAX_BILDER} st
                </span>
              </Label>

              <input
                ref={filinputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => läggTillBilder(e.target.files)}
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {bilder.map((b, idx) => (
                  <div
                    key={b.preview}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={b.preview}
                      alt={`Bild ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => taBortBild(idx)}
                      aria-label="Ta bort bild"
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {bilder.length < MAX_BILDER && (
                  <button
                    type="button"
                    onClick={() => filinputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs font-medium">Lägg till bild</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Bilder komprimeras automatiskt. Max {MAX_FILSTORLEK_MB} MB per bild.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Dina kontaktuppgifter</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Förifyllt från ditt konto. Du kan justera om något ändrats.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fornamn" className="text-sm">Förnamn</Label>
                  <Input
                    id="fornamn"
                    name="fornamn"
                    defaultValue={profil?.fornamn ?? ""}
                    required
                    autoComplete="given-name"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="efternamn" className="text-sm flex items-center justify-between">
                    <span>Efternamn</span>
                    <span className="text-xs font-normal text-muted-foreground">Valfritt</span>
                  </Label>
                  <Input
                    id="efternamn"
                    name="efternamn"
                    defaultValue={profil?.efternamn ?? ""}
                    autoComplete="family-name"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefon" className="text-sm flex items-center justify-between">
                  <span>Telefonnummer</span>
                  <span className="text-xs font-normal text-muted-foreground">Valfritt</span>
                </Label>
                <Input
                  id="telefon"
                  name="telefon"
                  type="tel"
                  inputMode="tel"
                  defaultValue={profil?.telefon ?? ""}
                  autoComplete="tel"
                  className="h-12 text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                E-post ({user?.email}) hämtas från ditt konto.
              </p>
            </div>

            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicerar…
                </>
              ) : (
                "Publicera annons"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
