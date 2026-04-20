import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import logo from "@/assets/logo.svg";

interface MiniMapProps {
  query: string;
  className?: string;
}

interface Coords {
  lat: number;
  lon: number;
}

const memoryCache = new Map<string, Coords | null>();
const inflight = new Map<string, Promise<Coords | null>>();
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

  const existing = inflight.get(query);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const url = `${base}/functions/v1/geocode?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Coords | null;
      writeCache(query, json);
      return json;
    } catch {
      return null;
    } finally {
      inflight.delete(query);
    }
  })();

  inflight.set(query, promise);
  return promise;
}

// Lon/lat -> tile coordinates (Web Mercator / slippy map)
function lonLatToTile(lon: number, lat: number, zoom: number) {
  const n = 2 ** zoom;
  const xTile = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yTile =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { xTile, yTile };
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
    const timer = setTimeout(
      () => {
        geocode(query).then((res) => {
          if (!cancelled) setCoords(res);
        });
      },
      Math.random() * 800,
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

  // Build a 2x2 tile grid centered on the coordinates.
  const zoom = 14;
  const tileSize = 256;
  const { xTile, yTile } = lonLatToTile(coords.lon, coords.lat, zoom);
  const xInt = Math.floor(xTile);
  const yInt = Math.floor(yTile);
  const xFrac = xTile - xInt;
  const yFrac = yTile - yInt;

  // We render a 2x2 grid (512x512) and offset it so the marker sits at center
  const gridW = tileSize * 2;
  const gridH = tileSize * 2;
  // Marker pixel position within the grid
  const markerX = (1 + (xFrac - 0.5)) * tileSize;
  const markerY = (1 + (yFrac - 0.5)) * tileSize;
  // Offset so the marker is at the visual center of the container
  // (container is 100% × h-32; we'll center via translate)
  const offsetX = -(markerX - gridW / 2);
  const offsetY = -(markerY - gridH / 2);

  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let dx = 0; dx <= 1; dx++) {
    for (let dy = 0; dy <= 1; dy++) {
      tiles.push({
        x: xInt + dx,
        y: yInt + dy,
        left: dx * tileSize,
        top: dy * tileSize,
      });
    }
  }

  return (
    <a
      href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=${zoom}/${coords.lat}/${coords.lon}`}
      target="_blank"
      rel="noopener noreferrer"
      className={"relative block overflow-hidden bg-primary/5 " + (className ?? "")}
      aria-label={`Visa ${query} på OpenStreetMap`}
    >
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: gridW,
          height: gridH,
          transform: `translate(${offsetX - gridW / 2}px, ${offsetY - gridH / 2}px)`,
        }}
      >
        {tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
            alt=""
            width={tileSize}
            height={tileSize}
            loading="lazy"
            className="absolute select-none"
            style={{ left: t.left, top: t.top }}
            draggable={false}
          />
        ))}
      </div>
      {/* Center pin */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <MapPin
          className="h-7 w-7 fill-primary text-primary-foreground drop-shadow"
          strokeWidth={2}
        />
      </div>
      {/* Subtle attribution */}
      <span className="pointer-events-none absolute bottom-0 right-0 bg-background/70 px-1 text-[9px] text-muted-foreground">
        © OpenStreetMap
      </span>
    </a>
  );
}
