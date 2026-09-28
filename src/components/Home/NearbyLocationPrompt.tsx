"use client";

import {
  Loader2,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Scissors,
} from "lucide-react";

import { Button } from "../ui/button";
import { IconTile } from "../Shared/FeatureCard";
import { cn } from "@/lib/utils";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { POPULAR_AREAS, type PopularArea } from "@/constants/popular-areas";

type NearbyLocationPromptProps = {
  onLocate: () => void;
  locating: boolean;
  onPickOnMap: () => void;
  onPickArea: (area: PopularArea) => void;
};

/**
 * The home page's "no location yet" state: why to share a location, three
 * ways to do it (GPS, a pin on the map, a popular area in one tap), and what
 * happens to it.
 *
 * Just the card: NearbySalons renders it inside its Section, under the shared
 * header. Phones get the buttons and a swipeable row of areas; the drawn map
 * only shows from lg, where there is room beside them.
 */
export default function NearbyLocationPrompt({
  onLocate,
  locating,
  onPickOnMap,
  onPickArea,
}: NearbyLocationPromptProps) {
  return (
    <div className="rounded-3xl border border-border bg-surface-subtle p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:p-10">
      <MapPreview className="hidden lg:order-last lg:block lg:h-100" />

      <div className="min-w-0">
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button
            type="button"
            size="lg"
            onClick={onLocate}
            disabled={locating}
            aria-busy={locating}
            className="w-full sm:w-auto"
          >
            {locating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LocateFixed />
            )}
            {locating ? "Finding you…" : "Use my current location"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onPickOnMap}
            aria-haspopup="dialog"
            className="w-full sm:w-auto"
          >
            <MapIcon />
            Pick on map
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Your location is only used to find salons nearby, and stays in this
          browser.
        </p>

        <div className="mt-6 border-t border-border pt-5">
          <p id="nearby-cta-areas" className="text-sm text-muted-foreground">
            Or start with a popular area
          </p>
          <div
            role="group"
            aria-labelledby="nearby-cta-areas"
            // One swipeable row on phones (running to the card's edges),
            // wrapped from sm up.
            className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {POPULAR_AREAS.map((area) => (
              <button
                key={area.name}
                type="button"
                onClick={() => onPickArea(area)}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 pointer-coarse:h-11"
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// [x, y, width, height] of the building blocks, drawn under the roads.
const BLOCKS: [number, number, number, number][] = [
  [8, 8, 62, 34],
  [108, 4, 62, 40],
  [212, 2, 96, 38],
  [362, 0, 52, 36],
  [8, 74, 62, 52],
  [108, 70, 62, 54],
  [212, 66, 98, 50],
  [446, 60, 40, 50],
  [8, 162, 62, 58],
  [108, 160, 64, 56],
  [230, 150, 78, 60],
  [352, 146, 58, 62],
  [446, 140, 40, 70],
  [8, 250, 60, 30],
  [108, 246, 66, 34],
  [352, 236, 60, 30],
];

// Kept clear of the corner label (top left) and the result card (bottom
// left), which would otherwise sit on top of them.
const PREVIEW_PINS = [
  { left: "29%", top: "56%", size: 20 },
  { left: "76%", top: "64%", size: 20 },
  { left: "68%", top: "88%", size: 18 },
  { left: "86%", top: "24%", size: 18 },
];

const Pin = ({ size, active = false }: { size: number; active?: boolean }) => (
  <svg
    width={size}
    height={Math.round(size * 1.3)}
    viewBox="-2 -2 28 36"
    className="drop-shadow-sm"
  >
    <path
      d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
      style={{
        fill: active ? "var(--gold-dark)" : "var(--gold)",
        stroke: "#fff",
        strokeWidth: 2,
      }}
    />
    <circle cx="12" cy="12" r="4.5" fill="#fff" />
  </svg>
);

/**
 * A drawn map, not a live one: the section is shown before we know where the
 * customer is, and a real map would load tiles for a spot we would only be
 * guessing. Purely decorative.
 */
function MapPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-2xl bg-muted ring-1 ring-border",
        className,
      )}
    >
      <svg
        viewBox="0 0 480 360"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {BLOCKS.map(([x, y, w, h]) => (
          <rect
            key={`${x},${y}`}
            x={x}
            y={y}
            width={w}
            height={h}
            rx="5"
            fill="#e4ded2"
          />
        ))}
        {/* Park */}
        <rect x="336" y="62" width="84" height="58" rx="14" fill="#dbe8d3" />
        {/* Water */}
        <path
          d="M-10 300 C 70 262, 150 334, 250 306 S 420 250, 500 286 L 500 380 L -10 380 Z"
          fill="#d3e3ec"
        />
        {/* Roads: a faint casing under a white fill */}
        <g fill="none" strokeLinecap="round" stroke="#dcd5c7">
          <path d="M-10 142 L 490 124" strokeWidth="18" />
          <path d="M190 -10 L 214 370" strokeWidth="18" />
          <path d="M-10 56 L 490 46" strokeWidth="10" />
          <path d="M-10 234 L 490 222" strokeWidth="10" />
          <path d="M88 -10 L 96 370" strokeWidth="10" />
          <path d="M326 -10 L 338 370" strokeWidth="10" />
          <path d="M430 -10 L 438 370" strokeWidth="10" />
        </g>
        <g fill="none" strokeLinecap="round" stroke="#ffffff">
          <path d="M-10 142 L 490 124" strokeWidth="13" />
          <path d="M190 -10 L 214 370" strokeWidth="13" />
          <path d="M-10 56 L 490 46" strokeWidth="6" />
          <path d="M-10 234 L 490 222" strokeWidth="6" />
          <path d="M88 -10 L 96 370" strokeWidth="6" />
          <path d="M326 -10 L 338 370" strokeWidth="6" />
          <path d="M430 -10 L 438 370" strokeWidth="6" />
        </g>
      </svg>

      {/* The reach, and the customer at its centre. */}
      <span className="absolute left-1/2 top-[48%] aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-info/40 bg-surface/40" />
      <span className="absolute left-1/2 top-[48%] block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-info shadow" />

      {PREVIEW_PINS.map((pin) => (
        <span
          key={`${pin.left},${pin.top}`}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: pin.left, top: pin.top }}
        >
          <Pin size={pin.size} />
        </span>
      ))}
      <span className="absolute left-[62%] top-[36%] -translate-x-1/2 -translate-y-full">
        <Pin size={28} active />
      </span>

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        <Navigation className="h-3 w-3 text-info" />
        Within {NEARBY_RADIUS_KM} km
      </span>

      {/* A result, the way the list will show it. */}
      <div className="absolute bottom-4 left-4 flex w-72 items-center gap-3 rounded-xl bg-surface p-2 pr-3 text-foreground shadow-card">
        <IconTile icon={Scissors} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">
            Nearest salon
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            350 m<span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Open now
            </span>
          </span>
        </span>
        <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          Book
        </span>
      </div>
    </div>
  );
}
