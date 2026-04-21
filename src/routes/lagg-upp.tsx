import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/lagg-upp")({
  head: () => ({
    meta: [
      { title: "Lägg upp annons — HomeFinder" },
      {
        name: "description",
        content: "Annonsera din hyresbostad gratis på HomeFinder.",
      },
      { property: "og:title", content: "Lägg upp annons — HomeFinder" },
      {
        property: "og:description",
        content: "Nå tusentals bostadssökande i hela Sverige.",
      },
    ],
  }),
  component: PostListing,
});

interface ProfilData {
  fornamn: string;
  efternamn: string;
  telefon: string;
}

function PostListing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [profilLoading, setProfilLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Visa auth-modal när direktbesök sker utan inloggning
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
    const beskrivning = String(fd.get("desc") ?? "").trim() || null;
    const fornamn = String(fd.get("fornamn") ?? "").trim();
    const efternamn = String(fd.get("efternamn") ?? "").trim();
    const telefon = String(fd.get("telefon") ?? "").trim();

    if (!titel) {
      toast.error("Fyll i adress/rubrik");
      return;
    }
    if (!fornamn || !efternamn || !telefon) {
      toast.error("Namn och telefon krävs");
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

    const { error } = await supabase.from("annonser").insert({
      titel,
      omrade: omrade || null,
      antal_rum,
      hyra: hyraNum ? `${hyraNum} kr/mån` : null,
      beskrivning,
      kontakt_email: user.email ?? "",
      kontakt_namn: `${fornamn} ${efternamn}`.trim(),
      kontakt_telefon: telefon,
      kalla: "Privat",
      user_id: user.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Kunde inte publicera annonsen: " + error.message);
      return;
    }

    setSubmitted(true);
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
                <Input id="city" name="city" placeholder="Södermalm" className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm">Hyra (kr/mån)</Label>
                <Input id="price" name="price" type="number" inputMode="numeric" placeholder="9500" className="h-12 text-base" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rooms" className="text-sm">Antal rum</Label>
                <Input id="rooms" name="rooms" type="number" inputMode="numeric" min={1} max={10} step={1} placeholder="2" className="h-12 text-base" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-sm">Beskrivning</Label>
              <Textarea
                id="desc"
                name="desc"
                rows={5}
                placeholder="Beskriv bostaden, läget och vad som ingår..."
                className="min-h-[140px] text-base"
              />
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
                  <Label htmlFor="efternamn" className="text-sm">Efternamn</Label>
                  <Input
                    id="efternamn"
                    name="efternamn"
                    defaultValue={profil?.efternamn ?? ""}
                    required
                    autoComplete="family-name"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefon" className="text-sm">Telefonnummer</Label>
                <Input
                  id="telefon"
                  name="telefon"
                  type="tel"
                  inputMode="tel"
                  defaultValue={profil?.telefon ?? ""}
                  required
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
