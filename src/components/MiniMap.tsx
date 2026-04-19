import { useEffect, useRef, useState } from "react";
import { Home } from "lucide-react";

interface MiniMapProps {
  query: string;
  className?: string;
}

interface Coords {
  lat: number;
  lon: number;
}

// Simple in-memory cache + localStorage cache to avoid hammering Nominatim
const memoryCache = new Map<string, Coords | null>();
const STORAGE_PREFIX = "geocode:";

function readCache(key: string): Coords | null | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as Coords | null;
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, value: Coords | null) {
  memoryCache.set(key, value);
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

async function geocode(query: string): Promise<Coords | null> {
  const cached = readCache(query);
  if (cached !== undefined) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=se&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) {
      writeCache(query, null);
      return null;
    }
    const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    writeCache(query, coords);
    return coords;
  } catch {
    return null;
  }
}

export function MiniMap({ query, className }: MiniMapProps) {
  const [coords, setCoords] = useState<Coords | null | undefined>(() =>
    readCache(query),
  );
  const requested = useRef(false);

  useEffect(() => {
    if (coords !== undefined || requested.current) return;
    requested.current = true;
    let cancelled = false;
    // Small jitter to avoid spamming Nominatim with simultaneous requests
    const timer = setTimeout(
      () => {
        geocode(query).then((res) => {
          if (!cancelled) setCoords(res);
        });
      },
      Math.random() * 600,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, coords]);

  if (coords === undefined) {
    return (
      <div
        className={
          "flex items-center justify-center bg-primary/5 text-primary " +
          (className ?? "")
        }
        aria-label="Laddar karta"
      >
        <div className="h-6 w-6 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  if (coords === null) {
    return (
      <div
        className={
          "flex items-center justify-center bg-primary/5 text-primary " +
          (className ?? "")
        }
        aria-label="Karta saknas"
      >
        <Home className="h-10 w-10" strokeWidth={1.5} />
      </div>
    );
  }

  // staticmap.openstreetmap.de — free, no API key, supports markers
  const zoom = 14;
  const size = "400x200";
  const marker = `${coords.lat},${coords.lon},lightblue1`;
  const src = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=${zoom}&size=${size}&markers=${marker}`;

  return (
    <a
      href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=${zoom}/${coords.lat}/${coords.lon}`}
      target="_blank"
      rel="noopener noreferrer"
      className={"block overflow-hidden " + (className ?? "")}
      aria-label={`Visa ${query} på OpenStreetMap`}
    >
      <img
        src={src}
        alt={`Karta över ${query}`}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={(e) => {
          // Hide broken image; parent shows bg
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </a>
  );
}
