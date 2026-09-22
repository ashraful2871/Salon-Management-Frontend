import { cookies } from "next/headers";
import { Suspense } from "react";

import Salons, { type SalonSort } from "@/components/Salons/Salons";
import { SalonListSkeleton } from "@/components/Shared/SkeletonCard";
import { getAllSalon } from "@/services/salon/getAllSalon";
import { reversePlace } from "@/services/geo/reversePlace";
import { isInBangladesh, roundCoord, shortPlaceLabel } from "@/lib/geo";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";

const PAGE_SIZE = 12;
const DEFAULT_RADIUS_KM = 5;
const SORTS: SalonSort[] = ["distance", "rating", "newest"];

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
  let point: { lat: number; lng: number; label?: string } | null = null;
  if (isInBangladesh(urlLat, urlLng)) {
    const lat = roundCoord(urlLat);
    const lng = roundCoord(urlLng);
    const sameAsSaved = saved && saved.lat === lat && saved.lng === lng;
    point = { lat, lng, label: sameAsSaved ? saved.label : undefined };
  } else if (resolvedSearchParams.near !== "off" && saved) {
    point = saved;
  }

  const r = toNumber(resolvedSearchParams.r);
  const radiusKm = Number.isFinite(r)
    ? Math.min(50, Math.max(0.5, r))
    : DEFAULT_RADIUS_KM;

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
    ...(point ? { lat: point.lat, lng: point.lng, radiusKm } : {}),
    sort,
    page,
    limit: PAGE_SIZE,
  };

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
    <Suspense fallback={<SalonListSkeleton />}>
      <Salons
        allSalons={res?.data ?? []}
        meta={res?.meta}
        nearby={nearby}
        sort={sort ?? (point ? "distance" : "newest")}
        error={res?.success === false ? res.message : undefined}
      />
    </Suspense>
  );
}
