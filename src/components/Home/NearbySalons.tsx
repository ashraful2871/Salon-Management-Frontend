"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, LocateFixed, MapPin } from "lucide-react";

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
  return first && first !== "Current location" ? first : null;
};

// Home "Salons near …" strip, right after the hero. A client component so the
// home page stays static: the saved location is a cookie the server page
// never reads.
export default function NearbySalons() {
  // Until mounted the cookie is unknown, so show neither the list nor the CTA.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const saved = useSavedLocation();
  const { locate, busy, canAsk } = useLocateAndSave();
  const [result, setResult] = useState<Result | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (!stored) setDialogOpen(true);
  };

  const dialog = (
    <LocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
  );

  if (mounted && !saved) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-gold/30 bg-gold/5 px-6 py-10 text-center md:flex-row md:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/15">
              <MapPin className="h-7 w-7 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Find salons near you
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                See the closest salons and how far each one is, then book in a
                few taps.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="gold"
                onClick={locateMe}
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <LocateFixed />
                )}
                Use my location
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(true)}
                aria-haspopup="dialog"
              >
                Choose area
              </Button>
            </div>
          </div>
        </div>
        {dialog}
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
    <section className="py-16" aria-labelledby="nearby-salons-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h2
              id="nearby-salons-heading"
              className="truncate font-display text-3xl font-bold text-foreground"
            >
              {place ? `Salons near ${place}` : "Salons near you"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Within {NEARBY_RADIUS_KM} km, closest first
              {saved && (
                <>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setDialogOpen(true)}
                    aria-haspopup="dialog"
                    className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    Change
                  </button>
                </>
              )}
            </p>
          </div>
          <Link
            href={seeAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            See all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading nearby salons"
            className="-mx-4 flex gap-5 overflow-hidden px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[280px] shrink-0 sm:w-[300px]">
                <SalonCardSkeleton />
              </div>
            ))}
          </div>
        ) : result?.failed ? (
          <p className="rounded-2xl border bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
            We couldn&apos;t load nearby salons right now.{" "}
            <Link href="/salons" className="font-semibold text-primary hover:underline">
              Browse all salons
            </Link>
          </p>
        ) : salons.length === 0 ? (
          <div className="rounded-2xl border bg-muted/40 px-6 py-8 text-center">
            <p className="font-semibold text-foreground">
              No salons within {NEARBY_RADIUS_KM} km
              {place ? ` of ${place}` : ""} yet.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                Change area
              </Button>
              <Button variant="gold" asChild>
                <Link href="/salons">Browse all salons</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul
            aria-label={place ? `Salons near ${place}` : "Salons near you"}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto overflow-y-hidden px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
          >
            {salons.map((salon, index) => (
              <li key={salon.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
                <SalonCard salon={salon} index={index} distance={salon.distance} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {dialog}
    </section>
  );
}
