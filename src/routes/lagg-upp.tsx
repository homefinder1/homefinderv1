import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
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

function PostListing() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const titel = String(fd.get("title") ?? "").trim();
    const omrade = String(fd.get("city") ?? "").trim();
    const hyraNum = String(fd.get("price") ?? "").trim();
    const antal_rum = Number(fd.get("rooms")) || null;
    const beskrivning = String(fd.get("desc") ?? "").trim() || null;
    const kontakt_email = String(fd.get("email") ?? "").trim();

    if (!titel || !kontakt_email) {
      toast.error("Fyll i adress och e-post");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("annonser").insert({
      titel,
      omrade: omrade || null,
      antal_rum,
      hyra: hyraNum ? `${hyraNum} kr/mån` : null,
      beskrivning,
      kontakt_email,
      kalla: "Privat",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Kunde inte publicera annonsen: " + error.message);
      return;
    }

    setSubmitted(true);
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
                <Input id="rooms" name="rooms" type="number" inputMode="decimal" step="0.5" placeholder="2" className="h-12 text-base" />
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Din e-post (visas för intresserade)</Label>
              <Input id="email" name="email" type="email" inputMode="email" placeholder="namn@exempel.se" required className="h-12 text-base" />
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
