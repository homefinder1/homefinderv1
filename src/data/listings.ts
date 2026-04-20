export type Source =
  | "MKB"
  | "Boplats"
  | "Boplats Syd"
  | "Blocket"
  | "Qasa"
  | "HomeQ"
  | "Bostadsdirekt"
  | "Privat";

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
    källa: (a.källa as Source) ?? "MKB",
  }));
}
