import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const SITE_URL = "https://homefinder.se";
const META_TITLE = "Lediga hyreslägenheter i Sverige — HomeFinder";
const META_DESCRIPTION =
  "Hitta din nästa hyresrätt på HomeFinder. Vi samlar lediga lägenheter från MKB, Boplats, HomeQ och fler källor på ett ställe.";

const FONT_STACK = "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const BRAND_BLUE = "#2563EB";
const BRAND_BLUE_HOVER = "#1D4ED8";
const SOFT_BG = "#F8F9FA";

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
        { type: "application/ld+json", children: JSON.stringify(website) },
        { type: "application/ld+json", children: JSON.stringify(organization) },
      ],
    };
  },
  component: Home,
});

const STADER = [
  "Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro",
  "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå",
];

const STEPS = [
  { n: "1", title: "Vi samlar", text: "Vi hämtar nya annonser från alla stora hyresvärdar varje dag." },
  { n: "2", title: "Du söker", text: "Filtrera på stad, hyra, storlek och antal rum." },
  { n: "3", title: "Du hittar", text: "Klicka direkt till hyresvärden och ansök." },
];

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatAntal(n: number): string {
  const rounded = Math.floor(n / 100) * 100;
  return rounded.toLocaleString("sv-SE").replace(/,/g, " ") + "+";
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const MOCK_LISTINGS = [
  { titel: "2 rum · Södermalm", pris: "8 500 kr/mån", källa: "Boplats Syd" },
  { titel: "3 rum · Linnéstaden", pris: "7 200 kr/mån", källa: "HomeQ" },
  { titel: "1 rum · Haga", pris: "5 900 kr/mån", källa: "MKB" },
  { titel: "4 rum · Östermalm", pris: "12 400 kr/mån", källa: "Boplats" },
  { titel: "2 rum · Majorna", pris: "6 800 kr/mån", källa: "Boplats Väst" },
  { titel: "3 rum · Möllevången", pris: "7 900 kr/mån", källa: "MKB" },
];

function CountUp({ target, duration = 1500, start }: { target: number; duration?: number; start: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return <>{value.toLocaleString("sv-SE").replace(/,/g, " ")}</>;
}

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      });
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [antalAnnonser, setAntalAnnonser] = useState<string>("7 700+");
  const [totalCount, setTotalCount] = useState<number>(0);
  const [cardOffset, setCardOffset] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);
  const [cityCounts, setCityCounts] = useState<Record<string, number> | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const [scraped, approved] = await Promise.all([
        supabase.from("scraped_annonser").select("*", { count: "exact", head: true }),
        supabase.from("annonser").select("*", { count: "exact", head: true }).eq("status", "godkand"),
      ]);
      const total = (scraped.count ?? 0) + (approved.count ?? 0);
      if (total > 0) {
        setAntalAnnonser(formatAntal(total));
        setTotalCount(Math.floor(total / 100) * 100);
      }
    })();
  }, []);

  // Cycle mockup cards
  useEffect(() => {
    const id = setInterval(() => {
      setCardVisible(false);
      setTimeout(() => {
        setCardOffset((o) => (o + 3) % MOCK_LISTINGS.length);
        setCardVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Per-city counts
  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        STADER.map(async (stad) => {
          const [a, b] = await Promise.all([
            supabase.from("scraped_annonser").select("*", { count: "exact", head: true }).ilike("omrade", `%${stad}%`),
            supabase.from("annonser").select("*", { count: "exact", head: true }).eq("status", "godkand").ilike("omrade", `%${stad}%`),
          ]);
          return [stad, (a.count ?? 0) + (b.count ?? 0)] as const;
        })
      );
      setCityCounts(Object.fromEntries(entries));
    })();
  }, []);

  // Stats in view
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setStatsInView(true); obs.disconnect(); } });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const visibleCards = Array.from({ length: 3 }, (_, i) => MOCK_LISTINGS[(cardOffset + i) % MOCK_LISTINGS.length]);

  const stats = [
    { value: antalAnnonser, label: "Aktiva annonser", animate: { target: totalCount, suffix: "+" } },
    { value: "5+", label: "Hyresvärdar & källor", animate: { target: 5, suffix: "+" } },
    { value: "24/7", label: "Automatisk uppdatering" },
    { value: "0 kr", label: "Helt gratis" },
  ];

  return (
    <div style={{ fontFamily: FONT_STACK, backgroundColor: "#ffffff", color: "#0a0a0a" }} className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
        {/* Dot grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            opacity: 0.55,
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        {/* Soft background glow behind mockup */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-1/4 h-[760px] w-[760px] rounded-full"
          style={{
            background: "radial-gradient(closest-side, #DBEAFE, #EFF6FF 55%, transparent 80%)",
            filter: "blur(50px)",
            opacity: 0.9,
          }}
        />
        <style>{`
          @keyframes hero-float {
            0%, 100% { transform: translateY(0px) rotate(2deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }
          @keyframes hero-text-in {
            0% { opacity: 0; transform: translateY(16px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .hero-float { animation: hero-float 4s ease-in-out infinite; }
          .hero-text-in { animation: hero-text-in 700ms ease-out both; }
        `}</style>
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-16 px-4 pb-20 pt-28 md:flex-row md:gap-20 md:pt-32">
          {/* Left column */}
          <div className="hero-text-in w-full text-center md:w-[52%] md:text-left">
            <Reveal>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
                style={{ borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", color: BRAND_BLUE }}
              >
                Helt gratis · Inget konto behövs
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1
                className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ color: "#0a0a0a", lineHeight: 1.05, letterSpacing: "-0.02em" }}
              >
                Sveriges lediga hyresrätter.
                <br />
                Samlade. Sökbara.
                <br />
                Gratis.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-2xl text-lg md:text-xl mx-auto md:mx-0" style={{ color: "#6B7280" }}>
                HomeFinder samlar hyresrätter från MKB, Boplats, HomeQ och fler – uppdaterat varje dag.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <Link
                to="/sok"
                className="mt-10 inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors"
                style={{ backgroundColor: BRAND_BLUE }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_BLUE_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_BLUE)}
              >
                Börja sök nu <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <Reveal delay={320} className="w-full">
              <div ref={statsRef} className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="text-center md:text-left">
                    <div className="text-2xl font-bold md:text-3xl" style={{ color: "#0a0a0a" }}>
                      {s.animate ? (
                        <><CountUp target={s.animate.target} start={statsInView} />{s.animate.suffix}</>
                      ) : s.value}
                    </div>
                    <div className="mt-1 text-xs md:text-sm" style={{ color: "#6B7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right column — mockup */}
          <div className="w-full md:w-[48%]">
            <Reveal delay={200}>
              <div className="hero-float relative mx-auto w-full max-w-xl">
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 rounded-3xl"
                  style={{
                    backgroundColor: "#F1F5F9",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
                  }}
                />
                <div
                  className="relative rounded-2xl border bg-white"
                  style={{
                    borderColor: "#E5E7EB",
                    boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15), 0 4px 12px -2px rgba(0,0,0,0.05)",
                  }}
                >
                {/* Top bar */}
                <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: "#F3F4F6" }}>
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#FFBD2E" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#28C840" }} />
                  </div>
                  <div
                    className="mx-auto rounded-md px-3 py-1 text-[10px]"
                    style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                  >
                    homefinder.se/sok
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Search bar */}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 rounded-md border px-3 py-2 text-xs"
                      style={{ borderColor: "#E5E7EB", color: "#9CA3AF" }}
                    >
                      Sök stad, område...
                    </div>
                    <button
                      type="button"
                      className="rounded-md px-3 py-2 text-xs font-medium text-white"
                      style={{ backgroundColor: BRAND_BLUE }}
                    >
                      Sök
                    </button>
                  </div>

                  {/* Listing cards */}
                  <div
                    className="mt-3 space-y-2 transition-opacity duration-300"
                    style={{ opacity: cardVisible ? 1 : 0 }}
                  >
                    {visibleCards.map((c, i) => (
                      <div
                        key={`${cardOffset}-${i}`}
                        className="flex items-center gap-3 rounded-lg border p-2"
                        style={{ borderColor: "#F3F4F6" }}
                      >
                        <div
                          className="h-12 w-12 shrink-0 rounded-md"
                          style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold" style={{ color: "#0a0a0a" }}>
                            {c.titel}
                          </div>
                          <div className="text-[11px]" style={{ color: "#6B7280" }}>{c.pris}</div>
                          <span
                            className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium"
                            style={{ backgroundColor: "#EFF6FF", color: BRAND_BLUE }}
                          >
                            {c.källa}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium" style={{ color: BRAND_BLUE }}>
                          Visa →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500"
          style={{ opacity: scrolled ? 0 : 1 }}
        >
          <ChevronDown className="h-7 w-7 animate-bounce" style={{ color: "#9CA3AF" }} />
        </div>
      </section>

      {/* Compare section */}
      <section className="px-4 py-24" style={{ backgroundColor: SOFT_BG }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl" style={{ color: "#0a0a0a", letterSpacing: "-0.02em" }}>
              Du borde inte behöva kolla<br />tio sajter varje dag
            </h2>
          </Reveal>

          <div className="mt-14 grid items-start gap-6 md:grid-cols-2">
            <Reveal delay={80} className="md:scale-[0.97] md:origin-top">
              <div
                className="rounded-2xl border p-7 text-left"
                style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#B91C1C" }}>
                  <XCircle className="h-5 w-5" /> Utan HomeFinder
                </div>
                <ul className="mt-5 space-y-3 text-sm" style={{ color: "#4B5563" }}>
                  {["Hoppa mellan 5–10 olika sajter varje dag","Olika konton, lösenord och köpoäng","Lätt att missa nya annonser","Ingen samlad bild av marknaden"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#B91C1C" }} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div
                className="rounded-2xl border p-8 text-left"
                style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>
                  <CheckCircle2 className="h-5 w-5" /> Med HomeFinder
                </div>
                <ul className="mt-5 space-y-3 text-sm" style={{ color: "#0a0a0a" }}>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_BLUE }} /> <span>Alla annonser samlade på ett ställe</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_BLUE }} /> <span>Sök, filtrera och jämför direkt</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_BLUE }} /> <span>Uppdateras dygnet runt</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_BLUE }} /> <span>Helt gratis – inget konto behövs</span></li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Så fungerar det */}
      <section className="px-4 py-24" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl" style={{ color: "#0a0a0a", letterSpacing: "-0.02em" }}>
              Så fungerar det
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={80 * (i + 1)}>
                <div>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                  >
                    {step.n}
                  </div>
                  <h3 className="mt-5 text-xl font-bold" style={{ color: "#0a0a0a" }}>{step.title}</h3>
                  <p className="mt-2 text-base" style={{ color: "#6B7280" }}>{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sök efter stad */}
      <section className="px-4 py-24" style={{ backgroundColor: SOFT_BG }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl" style={{ color: "#0a0a0a", letterSpacing: "-0.02em" }}>
              Sök efter stad
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {STADER.map((stad) => {
                const count = cityCounts?.[stad];
                const label = cityCounts == null
                  ? "Laddar..."
                  : `${count!.toLocaleString("sv-SE").replace(/,/g, " ")} annonser`;
                return (
                  <div key={stad} className="group relative">
                    <Link
                      to="/hyresratter/$stad"
                      params={{ stad: slugify(stad) }}
                      className="block rounded-full border px-5 py-2 text-sm font-medium transition-colors"
                      style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE, backgroundColor: "#ffffff" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = BRAND_BLUE;
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.color = BRAND_BLUE;
                      }}
                    >
                      {stad}
                    </Link>
                    <span
                      className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100"
                      style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t px-4 py-10" style={{ borderColor: "#E5E7EB", backgroundColor: "#ffffff" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm md:flex-row" style={{ color: "#6B7280" }}>
          <div>© {new Date().getFullYear()} HomeFinder</div>
          <div className="flex gap-6">
            <Link to="/sok" className="hover:underline">Sök bostäder</Link>
            <Link to="/lagg-upp" className="hover:underline">Lägg upp annons</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
