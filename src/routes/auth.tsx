import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Logga in eller skapa konto — HomeFinder" },
      { name: "description", content: "Logga in eller skapa konto för att lägga upp annonser." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

// Svenskt telefonnummer: tillåter 07X-XXX XX XX, +467XXXXXXXX, 08-XX XX XX, etc.
// Acceptera siffror, mellanslag, bindestreck och inledande +. Måste innehålla 8–13 siffror.
const telefonSchema = z
  .string()
  .trim()
  .min(1, "Telefonnummer krävs")
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    // Svenskt format: 8-10 siffror nationellt, eller 11-13 med landskod
    if (v.startsWith("+")) {
      // måste börja med +46 och därefter 8-10 siffror
      return /^\+46\d{8,10}$/.test(v.replace(/\s|-/g, ""));
    }
    // Nationellt: 0XX... totalt 9-10 siffror
    return /^0\d{8,9}$/.test(digits);
  }, "Ogiltigt svenskt telefonnummer (t.ex. 0701234567 eller +46701234567)");

const signupSchema = z.object({
  fornamn: z.string().trim().min(1, "Förnamn krävs").max(100),
  efternamn: z.string().trim().min(1, "Efternamn krävs").max(100),
  telefon: telefonSchema,
  email: z.string().trim().email("Ogiltig e-post").max(255),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fornamn, setFornamn] = useState("");
  const [efternamn, setEfternamn] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTarget = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: redirectTarget });
    });
  }, [navigate, redirectTarget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "signup") {
      const parsed = signupSchema.safeParse({ fornamn, efternamn, telefon, email, password });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter");
        return;
      }
      setBusy(true);
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTarget}`,
          data: {
            fornamn: parsed.data.fornamn,
            efternamn: parsed.data.efternamn,
            telefon: parsed.data.telefon,
          },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Konto skapat! Du loggas nu in.");
      navigate({ to: redirectTarget });
    } else {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error("Fel e-post eller lösenord");
        return;
      }
      navigate({ to: redirectTarget });
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {isSignup ? "Skapa konto" : "Logga in"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSignup
                  ? "Skapa ett konto för att lägga upp annonser"
                  : "Logga in på ditt konto"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fornamn" className="text-sm">Förnamn</Label>
                    <Input
                      id="fornamn"
                      value={fornamn}
                      onChange={(e) => setFornamn(e.target.value)}
                      required
                      autoComplete="given-name"
                      className="h-12 text-base sm:h-10 sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="efternamn" className="text-sm">Efternamn</Label>
                    <Input
                      id="efternamn"
                      value={efternamn}
                      onChange={(e) => setEfternamn(e.target.value)}
                      required
                      autoComplete="family-name"
                      className="h-12 text-base sm:h-10 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefon" className="text-sm">Telefonnummer</Label>
                  <Input
                    id="telefon"
                    type="tel"
                    inputMode="tel"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    required
                    placeholder="070-123 45 67"
                    autoComplete="tel"
                    className="h-12 text-base sm:h-10 sm:text-sm"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">E-post</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="h-12 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 w-full text-base sm:h-10 sm:text-sm" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignup ? "Skapar konto…" : "Loggar in…"}
                </>
              ) : isSignup ? (
                "Skapa konto"
              ) : (
                "Logga in"
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {isSignup ? "Har redan ett konto? Logga in" : "Inget konto? Skapa ett"}
          </button>
        </div>
      </div>
    </div>
  );
}
