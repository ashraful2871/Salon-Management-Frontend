"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinOff,
  Navigation,
  ShieldCheck,
  X,
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
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  parseSavedLocation,
  readLocationCookie,
} from "@/lib/location-cookie";
import LocationDialog from "./LocationDialog";

/** Set once the visitor has answered (allowed, picked an area or said not
 *  now). The card never comes back after that: asking on every visit is a nag. */
const ANSWERED_KEY = "sm_loc_asked";
/** Let the page paint and settle before asking. */
const ASK_DELAY_MS = 1500;
/** The home page's "Salons near you" section (NearbySalons). */
const NEARBY_SECTION_ID = "nearby";

const readAnswered = () => {
  try {
    return window.localStorage.getItem(ANSWERED_KEY) === "1";
  } catch {
    return true;
  }
};
const markAnswered = () => {
  try {
    window.localStorage.setItem(ANSWERED_KEY, "1");
  } catch {
    /* ignore */
  }
};

// After the dialog's close animation, so the scroll is not fighting it.
const scrollToNearby = () => {
  window.setTimeout(() => {
    document
      .getElementById(NEARBY_SECTION_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 250);
};

type Step = "hidden" | "ask" | "blocked";

const BENEFITS = [
  { icon: Navigation, text: `Salons within ${NEARBY_RADIUS_KM} km, closest first` },
  { icon: Clock, text: "Distance and open-now at a glance" },
  { icon: ShieldCheck, text: "Stays in this browser, never shared" },
];

/**
 * The first-visit location ask: a centred dialog on the home page, so the
 * first thing a new visitor is offered is the salons around them. Our own
 * dialog first, so the browser's prompt only appears once the visitor has
 * said yes to it (a prompt on load is mostly blocked on reflex, and then can
 * never be asked again). If the browser refuses, or location was blocked
 * before, it offers picking an area instead. Hidden for anyone who already
 * has a saved location.
 */
export default function LocationWelcome() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { locate, busy, canAsk } = useLocateAndSave();
  const [step, setStep] = useState<Step>("hidden");
  const [dialogOpen, setDialogOpen] = useState(false);

  // The layout outlives navigation, so this re-arms whenever the visitor
  // lands on the home page, not only on the first page load.
  useEffect(() => {
    if (!isHome) return;
    if (readAnswered() || parseSavedLocation(readLocationCookie())) return;
    const timer = window.setTimeout(() => {
      // Saved in another tab, or from a page button, while we waited.
      if (!readAnswered() && !parseSavedLocation(readLocationCookie())) {
        setStep("ask");
      }
    }, ASK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isHome]);

  const close = () => {
    markAnswered();
    setStep("hidden");
  };

  const allow = async () => {
    markAnswered();
    if (!canAsk) {
      setStep("blocked");
      return;
    }
    const loc = await locate();
    if (!loc) {
      setStep("blocked");
      return;
    }
    setStep("hidden");
    toast.success(`Showing salons near ${loc.label}`);
    // Saving fires the cookie event, which fills NearbySalons in place.
    scrollToNearby();
  };

  const pickArea = () => {
    markAnswered();
    setStep("hidden");
    setDialogOpen(true);
  };

  const asking = step === "ask";

  return (
    <>
      <Dialog
        open={isHome && step !== "hidden"}
        onOpenChange={(next) => {
          if (!next && !busy) close();
        }}
      >
        <DialogContent
          data-location-prompt
          showCloseButton={false}
          // The visitor chooses; nothing in the dialog should grab focus and
          // pop a phone's keyboard or a focus ring on open.
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl border-border bg-surface p-0 shadow-[0_24px_64px_-12px_rgb(0_0_0/0.35)] sm:max-w-md"
        >
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid size-10 cursor-pointer place-items-center rounded-full bg-surface/80 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>

          <Illustration blocked={!asking} />

          <div className="px-5 pb-5 pt-5 text-center sm:px-7 sm:pb-7">
            <DialogTitle className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {asking ? "Find salons near you" : "Location is turned off"}
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {asking
                ? "Turn on your location and we'll show the salons closest to you, ready to book."
                : "No problem. Pick your area instead, or turn location on later in your browser settings."}
            </DialogDescription>

            {asking && (
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
            )}

            <div className="mt-6 grid gap-2.5">
              {asking ? (
                <>
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
                    ) : (
                      <LocateFixed aria-hidden />
                    )}
                    {busy ? "Finding you…" : "Allow location"}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={pickArea}
                    disabled={busy}
                    aria-haspopup="dialog"
                    className="w-full"
                  >
                    <MapPin aria-hidden />
                    Choose my area
                  </Button>
                  <button
                    type="button"
                    onClick={close}
                    disabled={busy}
                    className="mx-auto mt-1 inline-flex min-h-11 cursor-pointer items-center px-4 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40"
                  >
                    Not now
                  </button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    size="lg"
                    onClick={pickArea}
                    aria-haspopup="dialog"
                    className="w-full"
                  >
                    <MapPin aria-hidden />
                    Choose my area
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={close}
                    className="w-full"
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
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
