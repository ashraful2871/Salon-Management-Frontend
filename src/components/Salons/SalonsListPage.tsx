import { cookies } from "next/headers";
import { Suspense } from "react";

import SalonsFilterBar from "@/components/Salons/SalonsFilterBar";
import SalonsIntro, { type SalonsIntroCopy } from "@/components/Salons/SalonsIntro";
import SalonsResults from "@/components/Salons/SalonsResults";
import {
  SALON_NOUN,
  type ListNoun,
  type SalonSort,
} from "@/components/Salons/types";
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

const PAGE_SIZE = 12;
const SORTS: SalonSort[] = ["distance", "rating", "newest"];
const AUDIENCES = ["LADIES", "GENTS"] as const;

type Audience = (typeof AUDIENCES)[number];
type Point = { lat: number; lng: number; label?: string };

const toNumber = (value?: string) =>
  value == null || value.trim() === "" ? NaN : Number(value);

/**
 * A salon list page: /salons, and /gents-parlour with `audience` pinned. The
 * search, area, service, near-me, sort and page all live in the URL, so a
 * list can be shared and undone with back; a new location from the dialog
 * starts the list again from it (lib/salon-list-paths).
 */
export default async function SalonsListPage({
  searchParams,
  audience: pinnedAudience,
  noun = SALON_NOUN,
  intro,
}: {
  searchParams: { [key: string]: string | undefined };
  /** Lists only this audience's own salons (no unisex) and hides the Ladies / Gents switch. */
  audience?: Audience;
  noun?: ListNoun;
  intro?: SalonsIntroCopy;
}) {
  const saved = parseSavedLocation(
    (await cookies()).get(LOCATION_COOKIE)?.value,
  );

  // Where to search from: the URL first (shareable), then the saved cookie
  // unless the customer asked for all salons with ?near=off.
  const urlLat = toNumber(searchParams.lat);
  const urlLng = toNumber(searchParams.lng);
  let point: Point | null = null;
  if (isInBangladesh(urlLat, urlLng)) {
    const lat = roundCoord(urlLat);
    const lng = roundCoord(urlLng);
    const sameAsSaved = saved && saved.lat === lat && saved.lng === lng;
    point = { lat, lng, label: sameAsSaved ? saved.label : undefined };
  } else if (searchParams.near !== "off" && saved) {
    point = saved;
  }

  // Never past NEARBY_RADIUS_KM, even for an older shared link with ?r=5.
  const r = toNumber(searchParams.r);
  const radiusKm = Number.isFinite(r)
    ? Math.min(NEARBY_RADIUS_KM, Math.max(0.5, r))
    : NEARBY_RADIUS_KM;

  const requestedSort = SORTS.find((s) => s === searchParams.sort);
  // "distance" needs a point; let the backend pick its default otherwise.
  const sort =
    requestedSort === "distance" && !point ? undefined : requestedSort;

  const requestedPage = Math.floor(toNumber(searchParams.page));
  const page = requestedPage > 1 ? requestedPage : 1;

  const query = {
    division: searchParams.division,
    district: searchParams.district,
    area: searchParams.area,
    searchTerm: searchParams.searchTerm,
    category: isServiceCategory(searchParams.category)
      ? searchParams.category
      : undefined,
    ...(pinnedAudience
      ? { audience: pinnedAudience, includeUnisex: false }
      : { audience: AUDIENCES.find((a) => a === searchParams.audience) }),
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
        <SalonsIntro point={point} {...intro} />
        <SalonsFilterBar audience={pinnedAudience} />
        <section aria-label={noun.many} className="py-6 md:py-10">
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
                  noun={noun}
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
  noun,
}: {
  query: Parameters<typeof getAllSalon>[0];
  point: Point | null;
  radiusKm: number;
  sort: SalonSort;
  noun: ListNoun;
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
      noun={noun}
      error={res?.success === false ? res.message : undefined}
    />
  );
}
