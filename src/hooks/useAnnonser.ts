import { useEffect, useState } from "react";
import { type Annons, type Source } from "@/data/listings";
import { supabase } from "@/integrations/supabase/client";

export interface AnnonsFilter {
  ort?: string;
  ytaMin?: number;
  ytaMax?: number;
  hyraMin?: number;
  hyraMax?: number;
  rum?: string; // "1".."4" eller "5" (5+) eller "alla"
  källa?: string; // exakt källnamn eller "alla"
  ledig?: "alla" | "nu" | "1m" | "3m" | "3m+";
}

export type SortVal =
  | "relevans"
  | "hyra-asc"
  | "hyra-desc"
  | "yta-asc"
  | "yta-desc"
  | "ledig-asc";

interface State {
  annonser: Annons[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface Args {
  filter: AnnonsFilter;
  sort: SortVal;
  sida: number;
  perSida: number;
}

function normaliseraKälla(k: string | undefined): Source {
  if (!k) return "MKB";
  if (k === "Boplats") return "Boplats Väst";
  return k as Source;
}

function rensaStorlek(s: string | null | undefined): string | undefined {
  if (!s) return undefined;
  const t = s.trim();
  if (!t || t.toLowerCase() === "okänd") return undefined;
  return t;
}

function isoDatum(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function useAnnonser({ filter, sort, sida, perSida }: Args): State {
  const [state, setState] = useState<State>({
    annonser: [],
    total: 0,
    loading: true,
    error: null,
  });

  // Stabilisera filter-nyckel så useEffect inte re-kör vid varje render
  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (supabase as any)
          .from("alla_annonser")
          .select("*", { count: "exact" });

        // Ort: sök i omrade ELLER titel (case-insensitive)
        if (filter.ort && filter.ort.trim()) {
          const ort = filter.ort.trim().replace(/[%,]/g, "");
          q = q.or(`omrade.ilike.%${ort}%,titel.ilike.%${ort}%`);
        }

        if (filter.källa && filter.källa !== "alla") {
          q = q.eq("kalla", filter.källa);
        }

        if (filter.rum && filter.rum !== "alla") {
          if (filter.rum === "5") {
            q = q.gte("rum_num", 5);
          } else {
            const n = parseInt(filter.rum, 10);
            // Matcha heltalsdelen: rum >= n och rum < n+1
            q = q.gte("rum_num", n).lt("rum_num", n + 1);
          }
        }

        if (filter.ytaMin != null) q = q.gte("storlek_num", filter.ytaMin);
        if (filter.ytaMax != null) q = q.lte("storlek_num", filter.ytaMax);
        if (filter.hyraMin != null) q = q.gte("hyra_num", filter.hyraMin);
        if (filter.hyraMax != null) q = q.lte("hyra_num", filter.hyraMax);

        if (filter.ledig && filter.ledig !== "alla") {
          const idag = new Date();
          idag.setHours(0, 0, 0, 0);
          if (filter.ledig === "nu") {
            q = q.lte("ledig_datum", isoDatum(idag));
          } else if (filter.ledig === "1m") {
            const g = new Date(idag);
            g.setMonth(g.getMonth() + 1);
            q = q.lte("ledig_datum", isoDatum(g));
          } else if (filter.ledig === "3m") {
            const g = new Date(idag);
            g.setMonth(g.getMonth() + 3);
            q = q.lte("ledig_datum", isoDatum(g));
          } else if (filter.ledig === "3m+") {
            const g = new Date(idag);
            g.setMonth(g.getMonth() + 3);
            q = q.gt("ledig_datum", isoDatum(g));
          }
        }

        // Sortering — null-värden hamnar alltid sist
        switch (sort) {
          case "hyra-asc":
            q = q.order("hyra_num", { ascending: true, nullsFirst: false });
            break;
          case "hyra-desc":
            q = q.order("hyra_num", { ascending: false, nullsFirst: false });
            break;
          case "yta-asc":
            q = q.order("storlek_num", { ascending: true, nullsFirst: false });
            break;
          case "yta-desc":
            q = q.order("storlek_num", { ascending: false, nullsFirst: false });
            break;
          case "ledig-asc":
            q = q.order("ledig_datum", { ascending: true, nullsFirst: false });
            break;
          case "relevans":
          default:
            // Privata annonser och nyast scraped först
            q = q.order("skapad_datum", { ascending: false, nullsFirst: false });
            break;
        }
        // Stabil sekundär sortering så pagineringen aldrig hoppar
        q = q.order("id", { ascending: true });

        const från = (sida - 1) * perSida;
        const till = från + perSida - 1;
        q = q.range(från, till);

        const { data, count, error } = await q;
        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as Array<{
          id: string;
          titel: string;
          omrade: string | null;
          antal_rum: string | null;
          storlek: string | null;
          hyra: string | null;
          ledig: string | null;
          url: string;
          kalla: string;
          skapad_datum: string;
        }>;

        const annonser: Annons[] = rows.map((r) => ({
          id: r.id,
          titel: r.titel,
          område: r.omrade ?? "",
          antal_rum: r.antal_rum ?? "—",
          storlek: rensaStorlek(r.storlek),
          hyra: r.hyra ?? "—",
          ledig: r.ledig ?? "",
          url: r.url,
          källa: normaliseraKälla(r.kalla),
          skapad: r.skapad_datum,
        }));

        setState({
          annonser,
          total: count ?? annonser.length,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          annonser: [],
          total: 0,
          loading: false,
          error:
            err instanceof Error ? err.message : "Kunde inte hämta annonser",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterKey, sort, sida, perSida]);

  return state;
}
