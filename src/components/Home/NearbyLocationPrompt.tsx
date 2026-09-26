"use client";

import Image from "next/image";
import { Loader2, LocateFixed, Map as MapIcon, Navigation } from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { FALLBACK_IMAGE } from "@/lib/salon-card";
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
 * Deliberately quiet: a light card with a hairline border and solid type. The
 * buttons are the site's own pair (the hero and CTA sections use the same
 * classes), so the section reads as part of the page. Phones get the map as a short strip
 * on top and the areas as a swipeable row.
 */
export default function NearbyLocationPrompt({
  onLocate,
  locating,
  onPickOnMap,
  onPickArea,
}: NearbyLocationPromptProps) {
  return (
    <section className="py-12 md:py-20" aria-labelledby="nearby-cta-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-[#ebe5d9] bg-[#faf8f4]">
          {/* grid-cols-1 is minmax(0, 1fr): without it the unwrapped area row on
              phones would stretch the column past the card and get clipped. */}
          <div className="grid grid-cols-1 items-center gap-7 p-4 sm:gap-10 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:p-14">
            <MapPreview className="h-44 sm:h-64 lg:order-last lg:h-100" />

            <div className="min-w-0 px-1 pb-2 sm:px-0 sm:pb-0">
              <p className="text-sm font-semibold text-primary">
                Salons near you
              </p>

              <h2
                id="nearby-cta-heading"
                className="mt-3 font-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-charcoal sm:text-[2.6rem] lg:text-[3.1rem]"
              >
                Find salons
                <br />
                around the corner.
              </h2>

              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-600 sm:text-base">
                Share your location or drop a pin. We&apos;ll list the closest
                salons first, with the distance, today&apos;s hours and prices,
                so you can book in a few taps.
              </p>

              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                <Button
                  type="button"
                  onClick={onLocate}
                  disabled={locating}
                  aria-busy={locating}
                  className="h-12 w-full cursor-pointer rounded-[14px] bg-primary px-7 text-[15px] font-semibold text-white sm:w-auto"
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                  {locating ? "Finding you…" : "Use my current location"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPickOnMap}
                  aria-haspopup="dialog"
                  className="h-12 w-full cursor-pointer rounded-2xl border border-primary/30 bg-white px-7 text-[15px] font-semibold text-slate-800 transition-all duration-300 hover:border-primary/40 hover:bg-white hover:text-primary hover:shadow-sm sm:w-auto"
                >
                  <MapIcon className="h-4 w-4" />
                  Pick on map
                </Button>
              </div>

              <p className="mt-3 text-xs leading-snug text-slate-500">
                Your location is only used to find salons nearby, and stays in
                this browser.
              </p>

              <div className="mt-8 border-t border-[#e7e0d3] pt-6">
                <p id="nearby-cta-areas" className="text-sm text-slate-500">
                  Or start with a popular area
                </p>
                <div
                  role="group"
                  aria-labelledby="nearby-cta-areas"
                  // One swipeable row on phones (running to the card's edges),
                  // wrapped from sm up.
                  className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
                >
                  {POPULAR_AREAS.map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => onPickArea(area)}
                      className="h-10 shrink-0 cursor-pointer rounded-full border border-[#e3dccd] bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
    className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.25)]"
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
        "relative overflow-hidden rounded-2xl bg-[#efebe3] ring-1 ring-black/6",
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
      <span className="absolute left-1/2 top-[48%] aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/40 bg-white/40" />
      <span className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 rounded-full bg-blue-500/30 motion-safe:animate-ping" />
        <span className="relative block h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow" />
      </span>

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

      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm sm:left-4 sm:top-4 sm:text-xs">
        <Navigation className="h-3 w-3 text-blue-600" />
        Within {NEARBY_RADIUS_KM} km
      </span>

      {/* A result, the way the list will show it. */}
      <div className="absolute bottom-4 left-4 hidden w-72 items-center gap-3 rounded-xl bg-white p-2 pr-3 text-charcoal shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)] sm:flex">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={FALLBACK_IMAGE}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">
            Nearest salon
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            350 m<span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open now
            </span>
          </span>
        </span>
        <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
          Book
        </span>
      </div>
    </div>
  );
}
