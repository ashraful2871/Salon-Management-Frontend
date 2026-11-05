import { cookies } from "next/headers";
import { Suspense } from "react";

import SalonsFilterBar from "@/components/Salons/SalonsFilterBar";
import SalonsIntro, { type SalonsIntroCopy } from "@/components/Salons/SalonsIntro";
import SalonsResults from "@/components/Salons/SalonsResults";
import {
  SALON_NOUN,
  type ListLocation,
  type ListNoun,
  type SalonSort,
} from "@/components/Salons/types";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { SalonGridSkeleton } from "@/components/Shared/SkeletonCard";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { getSalonAreas } from "@/services/salon/getSalonAreas";
import { isServiceCategory } from "@/constants/service-categories";
import { reversePlace } from "@/services/geo/reversePlace";
import {
  NEARBY_RADIUS_KM,
  isInBangladesh,
  roundCoord,
  shortPlaceLabel,
} from "@/lib/geo";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";
import type {
  ApiResponse,
  Bbox,
  SalonArea,
  SalonMarkerFilters,
} from "@/lib/api-types";

const PAGE_SIZE = 12;
const SORTS: SalonSort[] = ["distance", "rating", "newest"];
const AUDIENCES = ["LADIES", "GENTS"] as const;

type Audience = (typeof AUDIENCES)[number];

const toNumber = (value?: string) =>
  value == null || value.trim() === "" ? NaN : Number(value);

const clean = (value?: string) => value?.trim() || undefined;

/**
 * A salon list page: /salons, and /ladies-parlour and /gents-parlour with
 * `audience` pinned. The search, location, service, sort and page all live in
 * the URL, so a list can be shared and undone with back; a new location from
 * the navbar dialog starts the list again from it (lib/salon-list-paths).
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

  // Where to look: a point in the URL (shareable) first, then an area, then
  // the saved cookie unless the customer asked for every salon (?near=off).
  const urlLat = toNumber(searchParams.lat);
  const urlLng = toNumber(searchParams.lng);
  const area = clean(searchParams.area);
  let location: ListLocation;
  if (isInBangladesh(urlLat, urlLng)) {
    const lat = roundCoord(urlLat);
    const lng = roundCoord(urlLng);
    const sameAsSaved = saved && saved.lat === lat && saved.lng === lng;
    location = {
      kind: "near",
      lat,
      lng,
      label: sameAsSaved ? saved.label : undefined,
      fromCookie: false,
    };
  } else if (area) {
    location = { kind: "area", area, district: clean(searchParams.district) };
  } else if (searchParams.near !== "off" && saved) {
    location = { kind: "near", ...saved, fromCookie: true };
  } else {
    location = {
      kind: "all",
      district: clean(searchParams.district),
      division: clean(searchParams.division),
    };
  }
  const point = location.kind === "near" ? location : null;

  // Never past NEARBY_RADIUS_KM, even for an older shared link with ?r=5.
  const r = toNumber(searchParams.r);
  const radiusKm = Number.isFinite(r)
    ? Math.min(NEARBY_RADIUS_KM, Math.max(0.5, r))
    : NEARBY_RADIUS_KM;

  const requestedSort = SORTS.find((s) => s === searchParams.sort);
  // "distance" needs a point; let the backend pick its default otherwise.
  const sort =
    requestedSort === "distance" && !point ? undefined : requestedSort;
  const shownSort: SalonSort = sort ?? (point ? "distance" : "newest");

  const requestedPage = Math.floor(toNumber(searchParams.page));
  const page = requestedPage > 1 ? requestedPage : 1;

  const category = isServiceCategory(searchParams.category)
    ? searchParams.category
    : undefined;
  const audience = pinnedAudience
    ? { audience: pinnedAudience, includeUnisex: false as const }
    : { audience: AUDIENCES.find((a) => a === searchParams.audience) };

  // The place filters belong to the area and "all" modes only: a point
  // already says where.
  const place =
    location.kind === "area"
      ? { area: location.area, district: location.district }
      : location.kind === "all"
        ? { district: location.district, division: location.division }
        : {};

  const filters: SalonMarkerFilters = {
    searchTerm: clean(searchParams.searchTerm),
    category,
    ...audience,
    ...place,
  };

  const query = {
    ...filters,
    ...(point ? { lat: point.lat, lng: point.lng, radiusKm } : {}),
    sort,
    page,
    limit: PAGE_SIZE,
  };

  // The areas that have a live salon for this page (and service): the
  // location filter lists them and the map frames them. Started here, read
  // by both without either waiting on the other.
  const areas = getSalonAreas({ ...audience, category });

  // The intro and filter bar need only the URL and the cookie, so they paint
  // at once; only the list waits. No `key` on the Suspense: inside a filter
  // navigation the old grid stays on screen (dimmed by PendingRegion) until
  // the new one is ready, instead of flashing the skeleton.
  return (
    <FilterNavigationProvider>
      <div>
        <SalonsIntro location={location} {...intro} />
        <SalonsFilterBar
          audience={pinnedAudience}
          location={location}
          areas={areas}
          sort={shownSort}
          noun={noun}
        />
        <section aria-label={noun.many} className="py-5 md:py-8">
          <div
            id="salon-results-top"
            className="container mx-auto scroll-mt-[calc(5rem+var(--salons-bar-h,0px))] px-4 sm:px-6 lg:px-8"
          >
            <PendingRegion>
              <Suspense
                fallback={<SalonGridSkeleton nearby={location.kind !== "all"} />}
              >
                <SalonsResultsLoader
                  query={query}
                  location={location}
                  areas={areas}
                  filters={filters}
                  radiusKm={radiusKm}
                  noun={noun}
                  pinnedAudience={pinnedAudience}
                />
              </Suspense>
            </PendingRegion>
          </div>
        </section>
      </div>
    </FilterNavigationProvider>
  );
}

const same = (a?: string, b?: string) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** One box around every given box: what the map frames before a pan. */
const unionBox = (boxes: Bbox[]): Bbox | null =>
  boxes.length
    ? [
        Math.min(...boxes.map((b) => b[0])),
        Math.min(...boxes.map((b) => b[1])),
        Math.max(...boxes.map((b) => b[2])),
        Math.max(...boxes.map((b) => b[3])),
      ]
    : null;

async function SalonsResultsLoader({
  query,
  location,
  areas,
  filters,
  radiusKm,
  noun,
  pinnedAudience,
}: {
  query: Parameters<typeof getAllSalon>[0];
  location: ListLocation;
  areas: Promise<ApiResponse<SalonArea[]>>;
  filters: SalonMarkerFilters;
  radiusKm: number;
  noun: ListNoun;
  pinnedAudience?: Audience;
}) {
  const point = location.kind === "near" ? location : null;
  // A shared link carries coordinates but no label: look one up alongside
  // the list (the backend caches reverse lookups).
  const [res, place, areaList] = await Promise.all([
    getAllSalon(query),
    point && !point.label ? reversePlace(point.lat, point.lng) : null,
    areas,
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

  // What the map shows first when it is not around a point: the chosen
  // area's pins, or every area's (in the district of an older link).
  const known = areaList.success ? (areaList.data ?? []) : [];
  let frame: Bbox | null = null;
  if (location.kind === "area") {
    const hit =
      known.find(
        (a) =>
          same(a.area, location.area) &&
          (!location.district || same(a.district, location.district)),
      ) ?? null;
    frame =
      hit?.bbox ??
      (hit?.center
        ? [hit.center.lng, hit.center.lat, hit.center.lng, hit.center.lat]
        : null);
  } else if (location.kind === "all") {
    frame = unionBox(
      known
        .filter(
          (a) =>
            (!location.district || same(a.district, location.district)) &&
            (!location.division || same(a.division, location.division)),
        )
        .flatMap((a) => (a.bbox ? [a.bbox] : [])),
    );
  }

  return (
    <SalonsResults
      allSalons={res?.data ?? []}
      meta={res?.meta}
      location={location}
      nearby={nearby}
      frame={frame}
      mapFilters={filters}
      noun={noun}
      showAudience={!pinnedAudience}
      error={res?.success === false ? res.message : undefined}
    />
  );
}
