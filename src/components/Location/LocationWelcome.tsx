"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LocateFixed, MapPin, MapPinOff, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import {
  parseSavedLocation,
  readLocationCookie,
  type SavedLocation,
} from "@/lib/location-cookie";
import LocationDialog from "./LocationDialog";

/** Set once the visitor has answered (allowed, picked an area or said not
 *  now). The card never comes back after that: asking on every visit is a nag. */
const ANSWERED_KEY = "sm_loc_asked";
/** Let the page paint and settle before asking. */
const ASK_DELAY_MS = 1500;

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

type Step = "hidden" | "ask" | "blocked";

/**
 * The first-visit location ask. Our own card first, so the browser's prompt
 * only appears once the visitor has said yes to it (a prompt on load is
 * mostly blocked on reflex, and then can never be asked again). If the
 * browser refuses, or location was blocked before, it offers picking an area
 * instead. Hidden for anyone who already has a saved location.
 */
export default function LocationWelcome() {
  const router = useRouter();
  const pathname = usePathname();
  const { locate, busy, canAsk } = useLocateAndSave();
  const [step, setStep] = useState<Step>("hidden");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (readAnswered() || parseSavedLocation(readLocationCookie())) return;
    const timer = window.setTimeout(() => {
      // Saved in another tab, or from a page button, while we waited.
      if (!parseSavedLocation(readLocationCookie())) setStep("ask");
    }, ASK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    markAnswered();
    setStep("hidden");
  };

  // The location is a cookie the server components read, not a cache tag.
  const showNearby = (loc: SavedLocation) => {
    if (pathname === "/salons") {
      router.push(`/salons?lat=${loc.lat}&lng=${loc.lng}&sort=distance`);
    } else {
      router.refresh();
    }
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
    showNearby(loc);
  };

  const pickArea = () => {
    markAnswered();
    setStep("hidden");
    setDialogOpen(true);
  };

  return (
    <>
      {step !== "hidden" && (
        <section
          data-location-prompt
          aria-labelledby="location-welcome-title"
          className="fixed inset-x-3 bottom-[calc(0.75rem+var(--launcher-offset)+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-border bg-surface p-4 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.3)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:w-[24rem] sm:p-5"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-2 top-2 grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>

          <div className="flex gap-3 pr-8">
            <span
              className={
                step === "ask"
                  ? "grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover"
                  : "grid size-10 shrink-0 place-items-center rounded-full bg-warning-soft text-warning"
              }
            >
              {step === "ask" ? (
                <MapPin className="size-5" aria-hidden />
              ) : (
                <MapPinOff className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <h2
                id="location-welcome-title"
                className="text-base font-semibold leading-tight text-foreground"
              >
                {step === "ask"
                  ? "Find salons near you"
                  : "Location is turned off"}
              </h2>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {step === "ask"
                  ? `Share your location to see salons within ${NEARBY_RADIUS_KM} km, with distances. It stays in this browser.`
                  : "No problem. Pick your area instead, or turn location on later in your browser settings."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {step === "ask" ? (
              <>
                <Button type="button" variant="outline" onClick={close}>
                  Not now
                </Button>
                <Button
                  type="button"
                  onClick={allow}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <LocateFixed aria-hidden />
                  )}
                  {busy ? "Finding you…" : "Allow location"}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={close}>
                  Close
                </Button>
                <Button type="button" onClick={pickArea} aria-haspopup="dialog">
                  <MapPin aria-hidden />
                  Choose area
                </Button>
              </>
            )}
          </div>

          {step === "ask" && (
            <button
              type="button"
              onClick={pickArea}
              aria-haspopup="dialog"
              className="mt-3 w-full cursor-pointer text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Or choose your area
            </button>
          )}
        </section>
      )}

      <LocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
