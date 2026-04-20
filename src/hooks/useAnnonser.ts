import { useEffect, useState } from "react";
import {
  ANNONSER_URL,
  normaliseraAnnonser,
  type Annons,
  type RawAnnons,
} from "@/data/listings";
import { supabase } from "@/integrations/supabase/client";

interface State {
  annonser: Annons[];
  loading: boolean;
  error: string | null;
}

export function useAnnonser(): State {
  const [state, setState] = useState<State>({
    annonser: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [scrapedRes, dbRes] = await Promise.all([
          fetch(ANNONSER_URL, { cache: "no-store" }).then(async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return (await r.json()) as RawAnnons[];
          }),
          supabase
            .from("annonser")
            .select("*")
            .eq("status", "godkand")
            .order("skapad_datum", { ascending: false }),
        ]);

        if (cancelled) return;

        const scraped = normaliseraAnnonser(scrapedRes);

        const userListings: Annons[] = (dbRes.data ?? []).map((row) => ({
          id: `privat-${row.id}`,
          titel: row.titel,
          område: row.omrade ?? "",
          antal_rum:
            row.antal_rum != null ? `${row.antal_rum} rum` : "—",
          hyra: row.hyra ?? "—",
          ledig: row.skapad_datum,
          url: `mailto:${row.kontakt_email}?subject=${encodeURIComponent("Intresseanmälan: " + row.titel)}`,
          källa: "Privat" as Annons["källa"],
          skapad: row.skapad_datum,
        }));

        // Show user listings first (newest), then scraped
        setState({
          annonser: [...userListings, ...scraped],
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          annonser: [],
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Kunde inte hämta annonser",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
