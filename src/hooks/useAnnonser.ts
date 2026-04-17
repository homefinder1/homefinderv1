import { useEffect, useState } from "react";
import {
  ANNONSER_URL,
  normaliseraAnnonser,
  type Annons,
  type RawAnnons,
} from "@/data/listings";

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
        const res = await fetch(ANNONSER_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as RawAnnons[];
        if (cancelled) return;
        setState({
          annonser: normaliseraAnnonser(data),
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
