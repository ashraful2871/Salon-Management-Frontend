import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import SalonsFilterBar from "@/components/Salons/SalonsFilterBar";
import SalonsIntro from "@/components/Salons/SalonsIntro";
import SalonsResults from "@/components/Salons/SalonsResults";
import type { SalonSort } from "@/components/Salons/types";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { SalonGridSkeleton } from "@/components/Shared/SkeletonCard";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { isServiceCategory } from "@/constants/service-categories";
import { reversePlace } from "@/services/geo/reversePlace";
import {
  NEARBY_RADIUS_KM,
  isInBangladesh,
  roundCoord,
  shortPlaceLabel,
} from "@/lib/geo";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";

export const metadata: Metadata = {
  title: "Salons near you",
  description:
    "Browse salons near you, compare services, prices and ratings, and book an open slot.",
};

const PAGE_SIZE = 12;
const SORTS: SalonSort[] = ["distance", "rating", "newest"];

type Point = { lat: number; lng: number; label?: string };

const toNumber = (value?: string) =>
  value == null || value.trim() === "" ? NaN : Number(value);

export default async function SalonsStorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const saved = parseSavedLocation(
    (await cookies()).get(LOCATION_COOKIE)?.value,
  );

  // Where to search from: the URL first (shareable), then the saved cookie
  // unless the customer asked for all salons with ?near=off.
  const urlLat = toNumber(resolvedSearchParams.lat);
  const urlLng = toNumber(resolvedSearchParams.lng);
  let point: Point | null = null;
  if (isInBangladesh(urlLat, urlLng)) {
    const lat = roundCoord(urlLat);
    const lng = roundCoord(urlLng);
    const sameAsSaved = saved && saved.lat === lat && saved.lng === lng;
    point = { lat, lng, label: sameAsSaved ? saved.label : undefined };
  } else if (resolvedSearchParams.near !== "off" && saved) {
    point = saved;
  }

  // Never past NEARBY_RADIUS_KM, even for an older shared link with ?r=5.
  const r = toNumber(resolvedSearchParams.r);
  const radiusKm = Number.isFinite(r)
    ? Math.min(NEARBY_RADIUS_KM, Math.max(0.5, r))
    : NEARBY_RADIUS_KM;

  const requestedSort = SORTS.find((s) => s === resolvedSearchParams.sort);
  // "distance" needs a point; let the backend pick its default otherwise.
  const sort =
    requestedSort === "distance" && !point ? undefined : requestedSort;

  const requestedPage = Math.floor(toNumber(resolvedSearchParams.page));
  const page = requestedPage > 1 ? requestedPage : 1;

  const query = {
    division: resolvedSearchParams?.division,
    district: resolvedSearchParams?.district,
    area: resolvedSearchParams?.area,
    searchTerm: resolvedSearchParams?.searchTerm,
    category: isServiceCategory(resolvedSearchParams.category)
      ? resolvedSearchParams.category
      : undefined,
    ...(point ? { lat: point.lat, lng: point.lng, radiusKm } : {}),
    sort,
    page,
    limit: PAGE_SIZE,
  };

  // The intro and filter bar need only the URL and the cookie, so they paint
  // at once; only the list waits. No `key` on the Suspense: inside a filter
  // navigation the old grid stays on screen (dimmed by PendingRegion) until
  // the new one is ready, instead of flashing the skeleton.
  return (
    <FilterNavigationProvider>
      <div>
        <SalonsIntro point={point} />
        <SalonsFilterBar />
        <section aria-label="Salons" className="py-6 md:py-10">
          <div
            id="salon-results-top"
            className="container mx-auto scroll-mt-[calc(5rem+var(--salons-bar-h,0px))] px-4 sm:px-6 lg:px-8"
          >
            <PendingRegion>
              <Suspense fallback={<SalonGridSkeleton nearby={point !== null} />}>
                <SalonsResultsLoader
                  query={query}
                  point={point}
                  radiusKm={radiusKm}
                  sort={sort ?? (point ? "distance" : "newest")}
                />
              </Suspense>
            </PendingRegion>
          </div>
        </section>
      </div>
    </FilterNavigationProvider>
  );
}

async function SalonsResultsLoader({
  query,
  point,
  radiusKm,
  sort,
}: {
  query: Parameters<typeof getAllSalon>[0];
  point: Point | null;
  radiusKm: number;
  sort: SalonSort;
}) {
  // A shared link carries coordinates but no label: look one up alongside
  // the list (the backend caches reverse lookups).
  const [res, place] = await Promise.all([
    getAllSalon(query),
    point && !point.label ? reversePlace(point.lat, point.lng) : null,
  ]);

  const nearby = point
    ? {
        lat: point.lat,
        lng: point.lng,
        radiusKm,
        label:
          point.label ??
          (place?.success && place.data
            ? shortPlaceLabel(place.data)
            : "this location"),
      }
    : null;

  return (
    <SalonsResults
      allSalons={res?.data ?? []}
      meta={res?.meta}
      nearby={nearby}
      sort={sort}
      error={res?.success === false ? res.message : undefined}
    />
  );
}
