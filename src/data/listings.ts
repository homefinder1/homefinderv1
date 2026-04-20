export type Source =
  | "MKB"
  | "Boplats Väst"
  | "Boplats Syd"
  | "Blocket"
  | "Qasa"
  | "HomeQ"
  | "Bostadsdirekt"
  | "Privat";

/** Normalisera källnamn — gamla data kan innehålla "Boplats" som nu heter "Boplats Väst" */
function normaliseraKälla(k: string | undefined): Source {
  if (!k) return "MKB";
  if (k === "Boplats") return "Boplats Väst";
  return k as Source;
}

/** Annons från GitHub-JSON (raw fält som de kommer från filen) */
export interface RawAnnons {
  titel: string;
  område: string;
  antal_rum: string;
  storlek?: string;
  hyra: string;
  ledig: string;
  url: string;
  källa: string;
}

/** Normaliserad annons för UI */
export interface Annons {
  id: string;
  titel: string;
  område: string;
  antal_rum: string;
  storlek?: string;
  hyra: string;
  ledig: string;
  url: string;
  källa: Source;
}

export const ANNONSER_URL =
  "https://raw.githubusercontent.com/homefinder1/homefinderv1/main/annonser.json";

export function normaliseraAnnonser(raw: RawAnnons[]): Annons[] {
  return raw.map((a, i) => ({
    id: `${a.källa}-${i}-${a.titel}`,
    titel: a.titel,
    område: a.område ?? "",
    antal_rum: a.antal_rum,
    storlek: a.storlek && a.storlek.trim().toLowerCase() !== "okänd" ? a.storlek : undefined,
    hyra: a.hyra,
    ledig: a.ledig,
    url: a.url,
    källa: normaliseraKälla(a.källa),
  }));
}
