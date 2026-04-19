import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  LogOut,
  X,
  Mail,
  MapPin,
  Home,
  Search,
  Undo2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — HomeFinder" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Status = "vantande" | "godkand" | "avvisad";

interface AdminAnnons {
  id: string;
  titel: string;
  omrade: string | null;
  antal_rum: number | null;
  hyra: string | null;
  beskrivning: string | null;
  kontakt_email: string;
  status: Status;
  skapad_datum: string;
}

function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Status>("vantande");
  const [annonser, setAnnonser] = useState<AdminAnnons[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminAnnons[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadAnnonser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, tab]);

  // Debounced global search across all statuses
  useEffect(() => {
    if (!user || !isAdmin) return;
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const escaped = q.replace(/[%,]/g, "");
      const { data, error } = await supabase
        .from("annonser")
        .select("*")
        .or(
          `titel.ilike.%${escaped}%,omrade.ilike.%${escaped}%,kontakt_email.ilike.%${escaped}%`
        )
        .order("skapad_datum", { ascending: false })
        .limit(100);
      setSearching(false);
      if (error) {
        toast.error("Sökning misslyckades: " + error.message);
        return;
      }
      setSearchResults((data ?? []) as AdminAnnons[]);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, user, isAdmin]);

  async function loadAnnonser() {
    setLoading(true);
    const { data, error } = await supabase
      .from("annonser")
      .select("*")
      .eq("status", tab)
      .order("skapad_datum", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Kunde inte hämta annonser: " + error.message);
      return;
    }
    setAnnonser((data ?? []) as AdminAnnons[]);
  }

  async function setStatus(id: string, status: Status) {
    setActingId(id);
    const { error } = await supabase.from("annonser").update({ status }).eq("id", id);
    setActingId(null);
    if (error) {
      toast.error("Kunde inte uppdatera: " + error.message);
      return;
    }
    const label =
      status === "godkand"
        ? "Annons godkänd"
        : status === "avvisad"
          ? "Annons avvisad"
          : "Annons satt till väntande";
    toast.success(label);
    // Update both lists
    setAnnonser((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)).filter((a) => a.status === tab)
    );
    setSearchResults((prev) =>
      prev ? prev.map((a) => (a.id === id ? { ...a, status } : a)) : prev
    );
  }

  const isSearching = query.trim().length > 0;
  const visibleAnnonser = useMemo(
    () => (isSearching ? (searchResults ?? []) : annonser),
    [isSearching, searchResults, annonser]
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h1 className="text-xl font-semibold text-foreground">Saknar behörighet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Du är inloggad som <strong>{user.email}</strong> men har inte admin-rollen.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Be en befintlig administratör tilldela dig rollen, eller kör följande SQL i
              backend för att göra dig själv till admin (första gången):
            </p>
            <pre className="mt-3 overflow-auto rounded-md bg-muted p-3 text-xs">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user.id}', 'admin');`}
            </pre>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logga ut
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">Tillbaka</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin — Moderering
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inloggad som {user.email}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logga ut
          </Button>
        </div>

        <div className="mt-6 inline-flex rounded-lg border border-border bg-card p-1">
          {(["vantande", "godkand", "avvisad"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "vantande" ? "Väntande" : s === "godkand" ? "Godkända" : "Avvisade"}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : annonser.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Inga annonser i denna kategori.
            </div>
          ) : (
            annonser.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-foreground">{a.titel}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {a.omrade && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {a.omrade}
                        </span>
                      )}
                      {a.antal_rum != null && (
                        <span className="inline-flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" /> {a.antal_rum} rum
                        </span>
                      )}
                      {a.hyra && <span>{a.hyra}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {a.kontakt_email}
                      </span>
                    </div>
                    {a.beskrivning && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
                        {a.beskrivning}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Inskickad{" "}
                      {new Date(a.skapad_datum).toLocaleString("sv-SE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {a.status === "vantande"
                      ? "Väntande"
                      : a.status === "godkand"
                        ? "Godkänd"
                        : "Avvisad"}
                  </Badge>
                </div>

                {tab !== "godkand" || a.status !== "godkand" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.status !== "godkand" && (
                      <Button
                        size="sm"
                        onClick={() => setStatus(a.id, "godkand")}
                        disabled={actingId === a.id}
                      >
                        <Check className="h-4 w-4" />
                        Godkänn
                      </Button>
                    )}
                    {a.status !== "avvisad" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(a.id, "avvisad")}
                        disabled={actingId === a.id}
                      >
                        <X className="h-4 w-4" />
                        Avvisa
                      </Button>
                    )}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
