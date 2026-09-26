"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";

import { Button } from "../ui/button";
import SalonCard from "../Shared/SalonCard";
import { SalonCardSkeleton } from "../Shared/SkeletonCard";
import LocationDialog from "../Location/LocationDialog";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { toSalonCardData, type SalonCardData } from "@/lib/salon-card";
import { getNearbySalons } from "@/services/salon/getNearbySalons";

const LIMIT = 6;

const noopSubscribe = () => () => {};

type Result = { key: string; salons: SalonCardData[]; failed: boolean };

// "Dhanmondi, Dhaka" -> "Dhanmondi". GPS fixes without a place name read as
// "near you".
const placeName = (label: string) => {
  const first = label.split(",")[0]?.trim();
  return first && first !== "Current location" && first !== "Pinned location"
    ? first
    : null;
};

// Phones and tablets swipe through one row (the next card peeks in to say
// so); from lg up the six cards sit in a 3 x 2 grid.
const ROW_CLASS =
  "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden";
const ITEM_CLASS =
  "w-[82%] max-w-[330px] shrink-0 snap-start sm:w-[46%] lg:w-auto lg:max-w-none";

// Home "Salons near …" section, right after the hero. A client component so
// the home page stays static: the saved location is a cookie the server page
// never reads.
export default function NearbySalons() {
  // Until mounted the cookie is unknown, so show neither the list nor the CTA.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const saved = useSavedLocation();
  const { locate, busy, canAsk } = useLocateAndSave();
  const [result, setResult] = useState<Result | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"options" | "map">("options");
  const setDialog = (mode: "options" | "map") => {
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const lat = saved?.lat;
  const lng = saved?.lng;
  const key = lat != null && lng != null ? `${lat},${lng}` : "";

  useEffect(() => {
    if (lat == null || lng == null) return;
    let active = true;
    getNearbySalons({ lat, lng, limit: LIMIT, radiusKm: NEARBY_RADIUS_KM }).then(
      (res) => {
        if (!active) return;
        setResult({
          key: `${lat},${lng}`,
          salons: res.success ? (res.data ?? []).map(toSalonCardData) : [],
          failed: !res.success,
        });
      },
    );
    return () => {
      active = false;
    };
  }, [lat, lng]);

  const locateMe = async () => {
    const stored = canAsk ? await locate() : null;
    // Saving fires the cookie event, which re-renders this with the list.
    if (!stored) setDialog("options");
  };

  const locationDialog = (
    <LocationDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      initialStep={dialogMode}
    />
  );

  if (mounted && !saved) {
    return (
      <section className="py-14 md:py-20" aria-labelledby="nearby-cta-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-3xl bg-charcoal px-6 py-10 text-white shadow-card sm:px-10 md:px-14 md:py-14">
            {/* A faint street grid with a few pins: says "map" without a map. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_right,black_10%,transparent_70%)]"
            />
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-gold/30 blur-3xl"
            />
            <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 md:block">
              <MapPin className="absolute left-[22%] top-[26%] h-9 w-9 fill-gold/80 text-gold-light drop-shadow-lg" />
              <MapPin className="absolute left-[58%] top-[18%] h-7 w-7 fill-gold/60 text-gold-light/80" />
              <MapPin className="absolute left-[44%] top-[58%] h-11 w-11 fill-gold text-white drop-shadow-xl" />
              <MapPin className="absolute left-[76%] top-[52%] h-6 w-6 fill-gold/50 text-gold-light/70" />
              <span className="absolute left-[46%] top-[72%] h-16 w-16 -translate-x-1/4 rounded-full border border-gold/50" />
            </div>

            <div className="max-w-xl">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-light">
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                Near you
              </p>
              <h2
                id="nearby-cta-heading"
                className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl"
              >
                Find salons around the corner
              </h2>
              <p className="mt-3 text-sm text-white/75 sm:text-base">
                Share your location or drop a pin, and we&apos;ll show the
                closest salons with ratings, prices and how far each one is.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={locateMe}
                  disabled={busy}
                  aria-busy={busy}
                  className="rounded-full"
                >
                  {busy ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                  Use my location
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setDialog("map")}
                  aria-haspopup="dialog"
                  className="rounded-full border border-white/25 text-white hover:bg-white/10 hover:text-white"
                >
                  <MapIcon />
                  Pick on map
                </Button>
              </div>
            </div>
          </div>
        </div>
        {locationDialog}
      </section>
    );
  }

  const place = saved ? placeName(saved.label) : null;
  const loading = !mounted || result?.key !== key;
  const salons = loading ? [] : (result?.salons ?? []);
  const seeAllHref = saved
    ? `/salons?lat=${saved.lat}&lng=${saved.lng}&r=${NEARBY_RADIUS_KM}&sort=distance`
    : "/salons";

  return (
    <section
      className="relative py-14 md:py-20"
      aria-labelledby="nearby-salons-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3 bg-gradient-to-b from-cream/60 to-transparent"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-dark">
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              Near you
            </p>
            <h2
              id="nearby-salons-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
            >
              {place ? (
                <>
                  Salons near <span className="text-gold-dark">{place}</span>
                </>
              ) : (
                "Salons near you"
              )}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Within {NEARBY_RADIUS_KM} km, closest first. Book in a few taps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {saved && (
              <button
                type="button"
                onClick={() => setDialog("options")}
                aria-haspopup="dialog"
                aria-label={`Location: ${saved.label}. Change location`}
                className="inline-flex h-10 min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-full border border-border bg-background pl-3 pr-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span className="max-w-[12rem] truncate">{saved.label}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                  Change
                </span>
              </button>
            )}
            <Button variant="outline" asChild className="h-10 rounded-full border px-4">
              <Link href={seeAllHref}>
                <MapIcon />
                View on map
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div aria-busy="true" aria-label="Loading nearby salons" className={ROW_CLASS}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={ITEM_CLASS}>
                <SalonCardSkeleton />
              </div>
            ))}
          </div>
        ) : result?.failed ? (
          <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="font-semibold text-foreground">
              We couldn&apos;t load nearby salons right now.
            </p>
            <Button variant="outline" asChild className="mt-4 rounded-full">
              <Link href="/salons">Browse all salons</Link>
            </Button>
          </div>
        ) : salons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gold/40 bg-gold/5 px-6 py-12 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gold/15">
              <Search className="h-6 w-6 text-gold-dark" />
            </span>
            <p className="font-display text-lg font-semibold text-foreground">
              No salons within {NEARBY_RADIUS_KM} km
              {place ? ` of ${place}` : ""} yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another spot, or browse every salon in the city.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setDialog("map")}
              >
                <MapIcon />
                Pick another spot
              </Button>
              <Button variant="gold" asChild className="rounded-full">
                <Link href="/salons">Browse all salons</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul
            aria-label={place ? `Salons near ${place}` : "Salons near you"}
            className={ROW_CLASS}
          >
            {salons.map((salon, index) => (
              <li key={salon.id} className={ITEM_CLASS}>
                <SalonCard salon={salon} index={index} distance={salon.distance} />
              </li>
            ))}
            {/* The row's own way on, for thumbs that reach its end. */}
            <li className={`${ITEM_CLASS} lg:hidden`}>
              <Link
                href={seeAllHref}
                className="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-6 text-center transition-colors hover:bg-gold/10"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15">
                  <ArrowRight className="h-5 w-5 text-gold-dark" />
                </span>
                <span className="font-semibold text-foreground">
                  See all nearby salons
                </span>
                <span className="text-xs text-muted-foreground">
                  On the list and the map
                </span>
              </Link>
            </li>
          </ul>
        )}
      </div>
      {locationDialog}
    </section>
  );
}
