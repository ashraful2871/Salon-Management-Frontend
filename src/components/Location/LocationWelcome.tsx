"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinOff,
  Navigation,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  parseSavedLocation,
  readLocationCookie,
} from "@/lib/location-cookie";
import LocationDialog from "./LocationDialog";

/** Let the page paint before asking, and let the cookie be read after
 *  hydration, so a visitor who already has a location never sees a flash. */
const ASK_DELAY_MS = 800;
/** The home page's "Salons near you" section (NearbySalons). */
const NEARBY_SECTION_ID = "nearby";
/** Public pages that must stay reachable without a location (accepting an
 *  admin or agent invitation). */
const EXEMPT_PREFIXES = ["/invite"];

// After the dialog's close animation, so the scroll is not fighting it.
const scrollToNearby = () => {
  window.setTimeout(() => {
    document
      .getElementById(NEARBY_SECTION_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 250);
};

type Step = "ask" | "blocked";

const BENEFITS = [
  { icon: Navigation, text: `Salons within ${NEARBY_RADIUS_KM} km, closest first` },
  { icon: Clock, text: "Distance and open-now at a glance" },
  { icon: ShieldCheck, text: "Stays in this browser, never shared" },
];

/**
 * The location gate: every public page asks for the visitor's location
 * before they can browse, and the dialog cannot be dismissed (no close
 * button; Escape and outside clicks do nothing) until a location is saved in
 * the `sm_loc` cookie. Our own dialog comes first, so the browser's prompt
 * only appears once the visitor has pressed "Allow location".
 *
 * If the browser refuses (blocked before, denied now, no GPS, outside
 * Bangladesh) the dialog explains how to turn location on, and retries by
 * itself when the permission flips to allowed. Picking an area is the only
 * other way through: a site cannot re-open a permission the visitor blocked,
 * so without it they would be locked out for good.
 */
export default function LocationWelcome() {
  const pathname = usePathname();
  const exempt = EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
  const saved = useSavedLocation();
  const { locate, busy, canAsk } = useLocateAndSave();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("ask");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), ASK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const allow = async () => {
    if (!canAsk) {
      setStep("blocked");
      return;
    }
    const loc = await locate();
    if (!loc) {
      setStep("blocked");
      return;
    }
    toast.success(`Showing salons near ${loc.label}`);
    // Saving fires the cookie event, which closes this gate and fills
    // NearbySalons in place.
    if (pathname === "/") scrollToNearby();
  };

  // The visitor turned location on in the browser's site settings while the
  // "turned off" screen was up: try again without making them press anything.
  const prevCanAsk = useRef(canAsk);
  useEffect(() => {
    const wasBlocked = !prevCanAsk.current;
    prevCanAsk.current = canAsk;
    if (wasBlocked && canAsk && step === "blocked" && !busy) void allow();
    // allow() is recreated every render; only the permission flip matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAsk]);

  const hasLocation =
    saved !== null ||
    (ready && parseSavedLocation(readLocationCookie()) !== null);
  const open = ready && !exempt && !hasLocation && !pickerOpen;
  const asking = step === "ask";

  return (
    <>
      <Dialog
        open={open}
        // Required: nothing but a saved location closes it.
        onOpenChange={() => {}}
      >
        <DialogContent
          data-location-prompt
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          // Nothing in the dialog should grab focus and pop a phone's
          // keyboard or a focus ring on open.
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl border-border bg-surface p-0 shadow-[0_24px_64px_-12px_rgb(0_0_0/0.35)] sm:max-w-md"
        >
          <Illustration blocked={!asking} />

          <div className="px-5 pb-5 pt-5 text-center sm:px-7 sm:pb-7">
            <DialogTitle className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {asking ? "Turn on your location" : "Location is turned off"}
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {asking
                ? "We need your location to show the salons around you. Allow it to continue browsing."
                : "Your browser didn't share your location. Turn it on to continue."}
            </DialogDescription>

            {asking ? (
              <ul className="mx-auto mt-5 grid max-w-sm gap-2.5 text-left">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="mx-auto mt-5 grid max-w-sm list-decimal gap-1.5 rounded-2xl bg-surface-subtle py-3.5 pl-8 pr-4 text-left text-sm text-foreground marker:font-semibold marker:text-muted-foreground">
                <li>Tap the lock or settings icon next to the web address.</li>
                <li>
                  Set <span className="font-semibold">Location</span> to{" "}
                  <span className="font-semibold">Allow</span>.
                </li>
                <li>Come back here and press Try again.</li>
              </ol>
            )}

            <div className="mt-6 grid gap-2.5">
              <Button
                type="button"
                size="lg"
                onClick={allow}
                disabled={busy}
                aria-busy={busy}
                className="w-full"
              >
                {busy ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : asking ? (
                  <LocateFixed aria-hidden />
                ) : (
                  <RotateCcw aria-hidden />
                )}
                {busy ? "Finding you…" : asking ? "Allow location" : "Try again"}
              </Button>
              {!asking && (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setPickerOpen(true)}
                  disabled={busy}
                  aria-haspopup="dialog"
                  className="w-full"
                >
                  <MapPin aria-hidden />
                  Choose my area instead
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Closing it without picking brings the gate straight back. */}
      <LocationDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}

// [left, top, size] of the salon pins around the visitor.
const PINS: [string, string, number][] = [
  ["22%", "38%", 18],
  ["78%", "34%", 20],
  ["30%", "82%", 16],
  ["72%", "80%", 18],
];

/** A drawn "you, and salons around you" header. Purely decorative. */
function Illustration({ blocked }: { blocked: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative h-36 overflow-hidden sm:h-44",
        blocked ? "bg-warning-soft" : "bg-primary-soft",
      )}
    >
      {/* The reach: rings around the visitor. */}
      {[0.95, 0.65, 0.38].map((scale) => (
        <span
          key={scale}
          className={cn(
            "absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border",
            blocked ? "border-warning/25" : "border-primary/25 bg-surface/30",
          )}
          style={{ height: `${scale * 200}%` }}
        />
      ))}

      {!blocked &&
        PINS.map(([left, top, size]) => (
          <span
            key={`${left},${top}`}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left, top }}
          >
            <svg width={size} height={Math.round(size * 1.3)} viewBox="-2 -2 28 36">
              <path
                d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                style={{ fill: "var(--gold)", stroke: "#fff", strokeWidth: 2 }}
              />
              <circle cx="12" cy="12" r="4.5" fill="#fff" />
            </svg>
          </span>
        ))}

      <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-card sm:size-18">
        {!blocked && (
          <span className="absolute inset-0 rounded-full bg-primary/25 motion-safe:animate-ping [animation-duration:2s]" />
        )}
        {blocked ? (
          <MapPinOff className="relative size-7 text-warning" />
        ) : (
          <MapPin className="relative size-7 text-primary-hover sm:size-8" />
        )}
      </span>
    </div>
  );
}
