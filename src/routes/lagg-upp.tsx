import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Lägg upp annons
        </h1>
        <p className="mt-2 text-muted-foreground">
          Nå tusentals bostadssökande — det är gratis.
        </p>

        {submitted ? (
          <div className="mt-8 flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Annons mottagen!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vi granskar din annons och publicerar den inom 24 timmar.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Rubrik</Label>
              <Input id="title" placeholder="T.ex. Ljus tvåa i centrum" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Stad</Label>
                <Input id="city" placeholder="Stockholm" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Pris (kr/mån)</Label>
                <Input id="price" type="number" placeholder="9500" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rooms">Antal rum</Label>
                <Input id="rooms" type="number" placeholder="2" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Storlek (m²)</Label>
                <Input id="size" type="number" placeholder="48" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Beskrivning</Label>
              <Textarea
                id="desc"
                rows={5}
                placeholder="Beskriv bostaden, läget och vad som ingår..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Din e-post</Label>
              <Input id="email" type="email" placeholder="namn@exempel.se" required />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Publicera annons
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
