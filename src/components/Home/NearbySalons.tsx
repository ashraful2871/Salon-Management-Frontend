"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Map as MapIcon, MapPin, Search } from "lucide-react";

import { Button } from "../ui/button";
import SalonCard from "../Shared/SalonCard";
import { EmptyState } from "../Shared/EmptyState";
import { IconTile } from "../Shared/FeatureCard";
import { SNAP_ITEM, SNAP_ROW, Section, SectionHeader } from "../Shared/Section";
import { SalonCardSkeleton } from "../Shared/SkeletonCard";
import LocationDialog from "../Location/LocationDialog";
import NearbyLocationPrompt from "./NearbyLocationPrompt";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { saveLocation } from "@/lib/location-cookie";
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
      <Section labelledBy="nearby-salons-heading">
        <SectionHeader
          overline="Near you"
          title="Salons near you"
          titleId="nearby-salons-heading"
          description={`Share your location to see salons within ${NEARBY_RADIUS_KM} km.`}
        />
        <NearbyLocationPrompt
          onLocate={locateMe}
          locating={busy}
          onPickOnMap={() => setDialog("map")}
          // Saving fires the cookie event, which swaps this for the list.
          onPickArea={(area) =>
            saveLocation({
              lat: area.lat,
              lng: area.lng,
              label: `${area.name}, Dhaka`,
              source: "area",
            })
          }
        />
        {locationDialog}
      </Section>
    );
  }

  const place = saved ? placeName(saved.label) : null;
  const loading = !mounted || result?.key !== key;
  const salons = loading ? [] : (result?.salons ?? []);
  const seeAllHref = saved
    ? `/salons?lat=${saved.lat}&lng=${saved.lng}&r=${NEARBY_RADIUS_KM}&sort=distance`
    : "/salons";

  // Shared by the failed and the empty state.
  const fallbackActions = (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="outline" onClick={() => setDialog("map")}>
        <MapIcon />
        Pick another spot
      </Button>
      <Button asChild>
        <Link href="/salons">Browse all salons</Link>
      </Button>
    </div>
  );

  return (
    <Section labelledBy="nearby-salons-heading">
      <SectionHeader
        overline="Near you"
        titleId="nearby-salons-heading"
        title={
          place ? (
            <>
              Salons near <span className="text-primary">{place}</span>
            </>
          ) : (
            "Salons near you"
          )
        }
        description={`Within ${NEARBY_RADIUS_KM} km, closest first.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {saved && (
              <button
                type="button"
                onClick={() => setDialog("options")}
                aria-haspopup="dialog"
                aria-label={`Location: ${saved.label}. Change location`}
                className="inline-flex h-10 min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-full border border-border bg-surface pl-3 pr-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="max-w-[12rem] truncate">{saved.label}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                  Change
                </span>
              </button>
            )}
            <Button variant="outline" asChild>
              <Link href={seeAllHref}>
                <MapIcon />
                See all
              </Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div aria-busy="true" aria-label="Loading nearby salons" className={SNAP_ROW}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={SNAP_ITEM}>
              <SalonCardSkeleton />
            </div>
          ))}
        </div>
      ) : result?.failed ? (
        <div className="rounded-2xl border border-dashed border-border px-4">
          <EmptyState
            icon={MapPin}
            title="We couldn't load nearby salons right now."
            description="Try another spot, or browse every salon in the city."
            action={fallbackActions}
          />
        </div>
      ) : salons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4">
          <EmptyState
            icon={Search}
            title={`No salons within ${NEARBY_RADIUS_KM} km${place ? ` of ${place}` : ""} yet`}
            description="Try another spot, or browse every salon in the city."
            action={fallbackActions}
          />
        </div>
      ) : (
        <ul
          aria-label={place ? `Salons near ${place}` : "Salons near you"}
          className={SNAP_ROW}
        >
          {salons.map((salon, index) => (
            <li key={salon.id} className={SNAP_ITEM}>
              <SalonCard salon={salon} index={index} distance={salon.distance} />
            </li>
          ))}
          {/* The row's own way on, for thumbs that reach its end. */}
          <li className={`${SNAP_ITEM} lg:hidden`}>
            <Link
              href={seeAllHref}
              className="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-subtle p-6 text-center transition-colors hover:bg-primary-soft"
            >
              <IconTile icon={ArrowRight} />
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
      {locationDialog}
    </Section>
  );
}
