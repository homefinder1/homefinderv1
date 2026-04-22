import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MinAnnons {
  id: string;
  titel: string;
  omrade: string | null;
  hyra: string | null;
  status: "vantande" | "godkand" | "avvisad";
  skapad_datum: string;
  bilder: string[] | null;
}

export const Route = createFileRoute("/dina-annonser")({
  head: () => ({
    meta: [
      { title: "Dina annonser — HomeFinder" },
      {
        name: "description",
        content: "Hantera dina egna bostadsannonser på HomeFinder.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/dina-annonser" } });
    }
  },
  component: DinaAnnonserPage,
});

function statusBadge(status: MinAnnons["status"]) {
  switch (status) {
    case "godkand":
      return (
        <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-900">
          <CheckCircle2 className="h-3 w-3" />
          Godkänd
        </Badge>
      );
    case "avvisad":
      return (
        <Badge className="gap-1 border-0 bg-red-100 text-red-900">
          <XCircle className="h-3 w-3" />
          Avvisad
        </Badge>
      );
    case "vantande":
    default:
      return (
        <Badge className="gap-1 border-0 bg-amber-100 text-amber-900">
          <Clock className="h-3 w-3" />
          Väntar på granskning
        </Badge>
      );
  }
}

function DinaAnnonserPage() {
  const [annonser, setAnnonser] = useState<MinAnnons[]>([]);
  const [loading, setLoading] = useState(true);
  const [taBortId, setTaBortId] = useState<string | null>(null);
  const [taBortLoading, setTaBortLoading] = useState(false);

  async function ladda() {
    setLoading(true);
    const { data: ses } = await supabase.auth.getSession();
    const userId = ses.session?.user.id;
    if (!userId) {
      setAnnonser([]);
      setLoading(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("annonser")
      .select("id, titel, omrade, hyra, status, skapad_datum, bilder")
      .eq("user_id", userId)
      .order("skapad_datum", { ascending: false });
    if (error) {
      toast.error("Kunde inte hämta dina annonser: " + error.message);
      setAnnonser([]);
      setLoading(false);
      return;
    }
    setAnnonser((data ?? []) as MinAnnons[]);
    setLoading(false);
  }

  useEffect(() => {
    ladda();
  }, []);

  async function bekraftaTaBort() {
    if (!taBortId) return;
    setTaBortLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("annonser")
      .delete()
      .eq("id", taBortId);
    setTaBortLoading(false);
    if (error) {
      toast.error("Kunde inte ta bort: " + error.message);
      return;
    }
    setAnnonser((prev) => prev.filter((a) => a.id !== taBortId));
    setTaBortId(null);
    toast.success("Annonsen är borttagen");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Dina annonser
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Laddar…"
                  : `${annonser.length} annons${annonser.length === 1 ? "" : "er"}`}
              </p>
            </div>
          </div>
          <Button asChild className="gap-1.5">
            <Link to="/lagg-upp">
              <Plus className="h-4 w-4" />
              Lägg upp ny
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border bg-muted/30"
              />
            ))}
          </div>
        ) : annonser.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Du har inte lagt upp några annonser ännu
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Annonsera din hyresbostad gratis och nå tusentals bostadssökande.
            </p>
            <Button asChild className="mt-5 gap-1.5">
              <Link to="/lagg-upp">
                <Plus className="h-4 w-4" />
                Lägg upp annons
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {annonser.map((a) => {
              const förstaBild = a.bilder && a.bilder.length > 0 ? a.bilder[0] : null;
              return (
                <article
                  key={a.id}
                  className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-28">
                    {förstaBild ? (
                      <img
                        src={förstaBild}
                        alt={a.titel}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(a.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.skapad_datum).toLocaleDateString("sv-SE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="line-clamp-1 text-base font-semibold text-foreground">
                      {a.titel}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {a.omrade && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {a.omrade}
                        </span>
                      )}
                      <span className="font-medium text-foreground">
                        {a.hyra ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    {a.status === "godkand" && (
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link to="/annons/$id" params={{ id: a.id }}>
                          <Eye className="h-4 w-4" />
                          Visa
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link to="/lagg-upp" search={{ id: a.id }}>
                        <Pencil className="h-4 w-4" />
                        Redigera
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTaBortId(a.id)}
                      className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Ta bort
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!taBortId} onOpenChange={(o) => !o && setTaBortId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort annonsen?</AlertDialogTitle>
            <AlertDialogDescription>
              Den här åtgärden kan inte ångras. Annonsen tas bort permanent från
              HomeFinder och försvinner från sökresultaten direkt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={taBortLoading}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              disabled={taBortLoading}
              onClick={(e) => {
                e.preventDefault();
                bekraftaTaBort();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {taBortLoading ? "Tar bort…" : "Ta bort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
