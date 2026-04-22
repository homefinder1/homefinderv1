import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MapPin, BedDouble, Ruler, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MiniMap } from "@/components/MiniMap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FavoritAnnons {
  id: string;
  titel: string;
  omrade: string | null;
  antal_rum: number | null;
  storlek_num: number | null;
  hyra: string | null;
  bilder: string[] | null;
}

interface FavoritRad {
  id: string;
  annons_id: string;
  skapad_datum: string;
  annons: FavoritAnnons | null;
}

export const Route = createFileRoute("/favoriter")({
  head: () => ({
    meta: [
      { title: "Mina favoriter — HomeFinder" },
      { name: "description", content: "Dina sparade bostadsannonser på HomeFinder." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/favoriter" } });
    }
  },
  component: FavoriterPage,
});

function FavoriterPage() {
  const [favoriter, setFavoriter] = useState<FavoritRad[]>([]);
  const [loading, setLoading] = useState(true);

  async function ladda() {
    setLoading(true);
    const { data: ses } = await supabase.auth.getSession();
    const userId = ses.session?.user.id;
    if (!userId) {
      setFavoriter([]);
      setLoading(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rader, error } = await (supabase as any)
      .from("favoriter")
      .select("id, annons_id, skapad_datum")
      .eq("user_id", userId)
      .order("skapad_datum", { ascending: false });
    if (error) {
      toast.error("Kunde inte hämta favoriter");
      setLoading(false);
      return;
    }
    if (!rader || rader.length === 0) {
      setFavoriter([]);
      setLoading(false);
      return;
    }
    const ids = rader.map((r: { annons_id: string }) => r.annons_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: annonser } = await (supabase as any)
      .from("annonser")
      .select("id, titel, omrade, antal_rum, storlek_num, hyra, bilder")
      .in("id", ids)
      .eq("status", "godkand");
    const map = new Map<string, FavoritAnnons>();
    (annonser ?? []).forEach((a: FavoritAnnons) => map.set(a.id, a));
    setFavoriter(
      rader.map((r: { id: string; annons_id: string; skapad_datum: string }) => ({
        ...r,
        annons: map.get(r.annons_id) ?? null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    ladda();
  }, []);

  async function taBort(favoritId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("favoriter")
      .delete()
      .eq("id", favoritId);
    if (error) {
      toast.error("Kunde inte ta bort");
      return;
    }
    setFavoriter((prev) => prev.filter((f) => f.id !== favoritId));
    toast.success("Borttagen från favoriter");
  }

  const synliga = favoriter.filter((f) => f.annons);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mina favoriter
            </h1>
            <p className="text-sm text-muted-foreground">
              {synliga.length} sparad{synliga.length === 1 ? "" : "e"} bostad
              {synliga.length === 1 ? "" : "er"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-border bg-muted/30"
              />
            ))}
          </div>
        ) : synliga.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Inga favoriter ännu
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Klicka på hjärtat på en annons för att spara den här.
            </p>
            <Button asChild className="mt-5">
              <Link to="/sok">Bläddra bland bostäder</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {synliga.map((f) => {
              const a = f.annons!;
              return (
                <div
                  key={f.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <Link
                    to="/annons/$id"
                    params={{ id: a.id }}
                    className="block"
                  >
                    {a.bilder && a.bilder.length > 0 ? (
                      <div className="h-40 w-full overflow-hidden border-b border-border bg-muted">
                        <img
                          src={a.bilder[0]}
                          alt={a.titel}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <MiniMap
                        query={[a.omrade, a.titel].filter(Boolean).join(", ") || a.titel}
                        className="h-40 w-full border-b border-border"
                      />
                    )}
                    <div className="space-y-2 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                        {a.titel}
                      </h3>
                      {a.omrade && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{a.omrade}</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          {a.antal_rum ?? "—"}
                        </span>
                        {a.storlek_num != null && (
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            {a.storlek_num} m²
                          </span>
                        )}
                      </div>
                      <div className="border-t border-border/60 pt-2 text-sm font-semibold text-foreground">
                        {a.hyra ?? "—"}
                      </div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => taBort(f.id)}
                    aria-label="Ta bort från favoriter"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/90 text-red-600 shadow-sm backdrop-blur hover:bg-background hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
