import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const SITE_URL = "https://homefinder.se";

const META_TITLE = "Lediga hyreslägenheter i Sverige — HomeFinder";
const META_DESCRIPTION =
  "Hitta din nästa hyresrätt på HomeFinder. Vi samlar lediga lägenheter från MKB, Boplats, HomeQ och fler källor på ett ställe.";

export const Route = createFileRoute("/")({
  head: () => {
    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HomeFinder",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/sok?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "HomeFinder",
      url: SITE_URL,
      description: META_DESCRIPTION,
    };

    return {
      meta: [
        { title: META_TITLE },
        { name: "description", content: META_DESCRIPTION },
        { property: "og:title", content: META_TITLE },
        { property: "og:description", content: META_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: SITE_URL },
        { name: "twitter:title", content: META_TITLE },
        { name: "twitter:description", content: META_DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: SITE_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(website),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(organization),
        },
      ],
    };
  },
  component: Home,
});

const benefits = [
  {
    icon: Layers,
    title: "7 720+ annonser från flera källor",
    text: "Vi samlar lediga hyresrätter från MKB, Boplats, HomeQ och fler hyresvärdar — alla på ett ställe.",
  },
  {
    icon: RefreshCw,
    title: "Uppdateras automatiskt varje dag",
    text: "Våra robotar hämtar nya annonser dygnet runt så du alltid ser det senaste utbudet.",
  },
  {
    icon: Filter,
    title: "Smart filtrering",
    text: "Sök på ort, pris, storlek och antal rum — hitta exakt det du letar efter på sekunder.",
  },
  {
    icon: Wallet,
    title: "Helt gratis att använda",
    text: "Inga konton som krävs, inga avgifter, inga dolda kostnader. Vi finns för att underlätta ditt bostadssökande.",
  },
];

const stats = [
  { value: "7 720+", label: "Aktiva annonser" },
  { value: "5+", label: "Hyresvärdar & källor" },
  { value: "24/7", label: "Automatisk uppdatering" },
  { value: "0 kr", label: "Helt gratis" },
];

function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative flex h-screen min-h-[640px] flex-col overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-soft)" }}
        />
        <div
          className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-hero)" }}
        />

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-16 pt-8">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Sveriges hyresmarknad samlad på ett ställe
            </div>
          </div>
          <h1 className="text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Sluta leta på{" "}
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              tio olika sajter
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base text-muted-foreground md:text-lg">
            HomeFinder samlar lediga hyresrätter från MKB, Boplats, HomeQ och
            fler hyresvärdar — så du hittar din nästa bostad på ett enda ställe.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 gap-2 px-7 text-base">
              <Link to="/sok">
                Börja sök nu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Gratis · Inget konto behövs
            </p>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-foreground md:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <span className="text-xs font-medium">Scrolla ner</span>
            <ChevronDown className={`h-6 w-6 ${scrolled ? "animate-bounce" : ""}`} />
          </div>
        </div>
        </div>
      </section>

      {/* Varför HomeFinder */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Varför HomeFinder?
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Bostadssökande borde inte vara ett heltidsjobb
            </h2>
            <p className="mt-5 text-base text-muted-foreground md:text-lg">
              Den svenska hyresmarknaden är utspridd över dussintals olika
              webbplatser. Du måste registrera dig på MKB, ha koll på Boplats,
              kolla HomeQ — och ändå riskerar du att missa den perfekta
              lägenheten.
            </p>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Vi byggde HomeFinder för att lösa det. En sökmotor. Alla
              hyresvärdar. Inga prenumerationer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
              <div className="text-sm font-semibold text-destructive">
                Utan HomeFinder
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>· Hoppa mellan 5–10 olika sajter varje dag</li>
                <li>· Olika konton, lösenord och köpoäng</li>
                <li>· Lätt att missa nya annonser</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="text-sm font-semibold text-primary">
                Med HomeFinder
              </div>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Alla annonser samlade på ett ställe
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Sök, filtrera och jämför direkt
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Uppdateras dygnet runt — gratis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Allt du behöver för att hitta hem
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Vi tar hand om det tråkiga så du kan fokusera på det viktiga —
              att hitta din nästa bostad.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-14"
          style={{ background: "var(--gradient-soft)" }}
        >
          <div
            className="absolute -bottom-24 left-1/2 -z-10 h-[300px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Redo att hitta din nästa bostad?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Tusentals lediga hyresrätter väntar. Sök bland alla källor på
            sekunder.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="h-12 gap-2 px-7 text-base">
              <Link to="/sok">
                <Search className="h-4 w-4" />
                Börja sök nu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} HomeFinder — Sveriges hyresmarknad samlad
      </footer>
    </div>
  );
}
