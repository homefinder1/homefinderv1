import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UseFavoritResult {
  isFavorit: boolean;
  antal: number;
  toggle: () => Promise<void>;
  loading: boolean;
}

export function useFavorit(annonsId: string): UseFavoritResult {
  const { user } = useAuth();
  const [isFavorit, setIsFavorit] = useState(false);
  const [antal, setAntal] = useState(0);
  const [loading, setLoading] = useState(false);

  const laddaAntal = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc("rakna_favoriter", {
      _annons_id: annonsId,
    });
    if (typeof data === "number") setAntal(data);
  }, [annonsId]);

  useEffect(() => {
    laddaAntal();
  }, [laddaAntal]);

  useEffect(() => {
    if (!user) {
      setIsFavorit(false);
      return;
    }
    let aktiv = true;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("favoriter")
        .select("id")
        .eq("user_id", user.id)
        .eq("annons_id", annonsId)
        .maybeSingle();
      if (aktiv) setIsFavorit(!!data);
    })();
    return () => {
      aktiv = false;
    };
  }, [user, annonsId]);

  const toggle = useCallback(async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isFavorit) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("favoriter")
          .delete()
          .eq("user_id", user.id)
          .eq("annons_id", annonsId);
        setIsFavorit(false);
        setAntal((n) => Math.max(0, n - 1));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("favoriter")
          .insert({ user_id: user.id, annons_id: annonsId });
        if (!error) {
          setIsFavorit(true);
          setAntal((n) => n + 1);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, isFavorit, annonsId, loading]);

  return { isFavorit, antal, toggle, loading };
}
