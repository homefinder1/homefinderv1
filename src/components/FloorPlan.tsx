import { Home } from "lucide-react";

/**
 * Generic, schematic SVG floor plans for apartment types.
 * Uses currentColor so they inherit text color (e.g. text-primary).
 * Rooms: K = Kök, B = Bad, S = Sov, V = Vardagsrum
 */

interface FloorPlanProps {
  rooms: number | null;
  className?: string;
}

const COMMON_PROPS = {
  viewBox: "0 0 120 80",
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round" as const,
};

const LABEL_PROPS = {
  fill: "currentColor",
  fontSize: 7,
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  textAnchor: "middle" as const,
  dominantBaseline: "central" as const,
  opacity: 0.7,
};

function Plan1Rok({ className }: { className?: string }) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <rect x="2" y="2" width="116" height="76" rx="2" />
      {/* Vertical split: left = kök, right = vardagsrum/sov */}
      <line x1="48" y1="2" x2="48" y2="50" />
      {/* Bad bottom-left */}
      <line x1="2" y1="50" x2="48" y2="50" />
      <text x="25" y="26" {...LABEL_PROPS}>Kök</text>
      <text x="25" y="64" {...LABEL_PROPS}>Bad</text>
      <text x="83" y="40" {...LABEL_PROPS}>Vardagsrum</text>
    </svg>
  );
}

function Plan2Rok({ className }: { className?: string }) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <rect x="2" y="2" width="116" height="76" rx="2" />
      {/* Top row: Kök | Vardagsrum */}
      <line x1="2" y1="42" x2="118" y2="42" />
      <line x1="50" y1="2" x2="50" y2="42" />
      {/* Bottom row: Bad | Sov */}
      <line x1="40" y1="42" x2="40" y2="78" />
      <text x="26" y="22" {...LABEL_PROPS}>Kök</text>
      <text x="84" y="22" {...LABEL_PROPS}>Vardagsrum</text>
      <text x="21" y="60" {...LABEL_PROPS}>Bad</text>
      <text x="79" y="60" {...LABEL_PROPS}>Sovrum</text>
    </svg>
  );
}

function Plan3Rok({ className }: { className?: string }) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <rect x="2" y="2" width="116" height="76" rx="2" />
      {/* Top: Kök | Vardagsrum (large) */}
      <line x1="2" y1="42" x2="118" y2="42" />
      <line x1="44" y1="2" x2="44" y2="42" />
      {/* Bottom: Bad | Sov | Sov */}
      <line x1="32" y1="42" x2="32" y2="78" />
      <line x1="75" y1="42" x2="75" y2="78" />
      <text x="23" y="22" {...LABEL_PROPS}>Kök</text>
      <text x="81" y="22" {...LABEL_PROPS}>Vardagsrum</text>
      <text x="17" y="60" {...LABEL_PROPS}>Bad</text>
      <text x="53" y="60" {...LABEL_PROPS}>Sov</text>
      <text x="96" y="60" {...LABEL_PROPS}>Sov</text>
    </svg>
  );
}

function Plan4Rok({ className }: { className?: string }) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <rect x="2" y="2" width="116" height="76" rx="2" />
      {/* Top row: Kök | Vardagsrum | Sov */}
      <line x1="2" y1="40" x2="118" y2="40" />
      <line x1="38" y1="2" x2="38" y2="40" />
      <line x1="84" y1="2" x2="84" y2="40" />
      {/* Bottom row: Sov | Bad | Sov */}
      <line x1="44" y1="40" x2="44" y2="78" />
      <line x1="76" y1="40" x2="76" y2="78" />
      <text x="20" y="21" {...LABEL_PROPS}>Kök</text>
      <text x="61" y="21" {...LABEL_PROPS}>Vardagsrum</text>
      <text x="101" y="21" {...LABEL_PROPS}>Sov</text>
      <text x="23" y="59" {...LABEL_PROPS}>Sov</text>
      <text x="60" y="59" {...LABEL_PROPS}>Bad</text>
      <text x="97" y="59" {...LABEL_PROPS}>Sov</text>
    </svg>
  );
}

function Plan5PlusRok({ className }: { className?: string }) {
  return (
    <svg {...COMMON_PROPS} className={className}>
      <rect x="2" y="2" width="116" height="76" rx="2" />
      {/* Top: Kök | Vardagsrum | Matsal */}
      <line x1="2" y1="40" x2="118" y2="40" />
      <line x1="34" y1="2" x2="34" y2="40" />
      <line x1="80" y1="2" x2="80" y2="40" />
      {/* Bottom: Sov | Sov | Bad | Sov */}
      <line x1="32" y1="40" x2="32" y2="78" />
      <line x1="60" y1="40" x2="60" y2="78" />
      <line x1="84" y1="40" x2="84" y2="78" />
      <text x="18" y="21" {...LABEL_PROPS}>Kök</text>
      <text x="57" y="21" {...LABEL_PROPS}>Vardagsrum</text>
      <text x="99" y="21" {...LABEL_PROPS}>Matsal</text>
      <text x="17" y="59" {...LABEL_PROPS}>Sov</text>
      <text x="46" y="59" {...LABEL_PROPS}>Sov</text>
      <text x="72" y="59" {...LABEL_PROPS}>Bad</text>
      <text x="101" y="59" {...LABEL_PROPS}>Sov</text>
    </svg>
  );
}

function PlanUnknown({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Home className="h-full w-full" strokeWidth={1.5} />
    </div>
  );
}

/** Parse a "antal_rum" string like "2 rum", "3.5 rum och kök", "1 rok" → integer */
export function parseRooms(antalRum: string | null | undefined): number | null {
  if (!antalRum) return null;
  const match = antalRum.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(",", "."));
  if (isNaN(n)) return null;
  return Math.round(n);
}

export function FloorPlan({ rooms, className }: FloorPlanProps) {
  if (rooms === null || rooms < 1) return <PlanUnknown className={className} />;
  if (rooms === 1) return <Plan1Rok className={className} />;
  if (rooms === 2) return <Plan2Rok className={className} />;
  if (rooms === 3) return <Plan3Rok className={className} />;
  if (rooms === 4) return <Plan4Rok className={className} />;
  return <Plan5PlusRok className={className} />;
}
