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
  User as UserIcon,
  Phone,
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
  kontakt_namn: string | null;
  kontakt_telefon: string | null;
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
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin — Moderering
            </h1>
            <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
              Inloggad som {user.email}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="h-10 self-start sm:self-auto">
            <LogOut className="h-4 w-4" />
            Logga ut
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            className={`inline-flex w-full overflow-x-auto rounded-lg border border-border bg-card p-1 sm:w-auto ${
              isSearching ? "opacity-50" : ""
            }`}
          >
            {(["vantande", "godkand", "avvisad"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setTab(s)}
                disabled={isSearching}
                className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4 sm:py-1.5 ${
                  tab === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } disabled:cursor-not-allowed`}
              >
                {s === "vantande" ? "Väntande" : s === "godkand" ? "Godkända" : "Avvisade"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:ml-auto sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök titel, område eller email…"
              className="h-11 pl-9 text-base sm:h-10 sm:text-sm"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {isSearching && (
          <p className="mt-3 text-xs text-muted-foreground">
            Söker bland alla annonser oavsett status
            {searchResults && !searching ? ` — ${searchResults.length} träff(ar)` : ""}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {(!isSearching && loading) || (isSearching && searching && !searchResults) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visibleAnnonser.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              {isSearching ? "Inga träffar." : "Inga annonser i denna kategori."}
            </div>
          ) : (
            visibleAnnonser.map((a) => (
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
                        <Mail className="h-3.5 w-3.5" />{" "}
                        <a href={`mailto:${a.kontakt_email}`} className="hover:text-foreground hover:underline">
                          {a.kontakt_email}
                        </a>
                      </span>
                      {a.kontakt_namn && (
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5" /> {a.kontakt_namn}
                        </span>
                      )}
                      {a.kontakt_telefon && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />{" "}
                          <a
                            href={`tel:${a.kontakt_telefon.replace(/\s|-/g, "")}`}
                            className="hover:text-foreground hover:underline"
                          >
                            {a.kontakt_telefon}
                          </a>
                        </span>
                      )}
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
                  <Badge
                    variant={
                      a.status === "godkand"
                        ? "default"
                        : a.status === "avvisad"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {a.status === "vantande"
                      ? "Väntande"
                      : a.status === "godkand"
                        ? "Godkänd"
                        : "Avvisad"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {a.status !== "godkand" && (
                    <Button
                      size="lg"
                      className="h-11 w-full sm:h-9 sm:w-auto"
                      onClick={() => setStatus(a.id, "godkand")}
                      disabled={actingId === a.id}
                    >
                      <Check className="h-4 w-4" />
                      Godkänn
                    </Button>
                  )}
                  {a.status !== "avvisad" && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-11 w-full sm:h-9 sm:w-auto"
                      onClick={() => setStatus(a.id, "avvisad")}
                      disabled={actingId === a.id}
                    >
                      <X className="h-4 w-4" />
                      Avvisa
                    </Button>
                  )}
                  {a.status === "godkand" && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-11 w-full sm:h-9 sm:w-auto"
                      onClick={() => setStatus(a.id, "vantande")}
                      disabled={actingId === a.id}
                    >
                      <Undo2 className="h-4 w-4" />
                      Ta ner (sätt som väntande)
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
