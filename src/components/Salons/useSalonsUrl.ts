"use client";
import { usePathname, useSearchParams } from "next/navigation";

import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { roundCoord } from "@/lib/geo";

/** Every URL key that says where the list is looking. */
const LOCATION_KEYS = ["lat", "lng", "r", "near", "area", "district", "division"] as const;

/**
 * The list page's URL as the filter bar and the results both change it. It
 * stays on the page it is on: /salons, /ladies-parlour or /gents-parlour
 * (lib/salon-list-paths).
 */
export function useSalonsUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate: pushUrl, isPending } = useFilterNavigation();

  // Every list change goes through the URL so it can be shared and undone
  // with back. Anything but a page turn starts again from page 1.
  const navigate = (
    changes: Record<string, string | null | undefined>,
    { keepPage = false } = {},
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!keepPage) params.delete("page");
    const qs = params.toString();
    // A page turn keeps the reader where the list starts rather than
    // throwing them back up to the search box.
    pushUrl(qs ? `${pathname}?${qs}` : pathname, { scroll: !keepPage });
  };

  // "Nearest" means nothing without a point, so it falls back to the default.
  const sortWithoutPoint = () =>
    searchParams.get("sort") === "distance" ? null : searchParams.get("sort");

  const cleared = Object.fromEntries(LOCATION_KEYS.map((k) => [k, null]));

  /** The three location modes (components/Salons/types ListLocation). */
  const location = {
    /** Every salon, ignoring the saved location too; `also` clears more in the same step. */
    all: (also: Record<string, null> = {}) =>
      navigate({ ...cleared, near: "off", sort: sortWithoutPoint(), ...also }),
    /** One real area from GET /salons/areas. */
    area: (area: string, district?: string) =>
      navigate({
        ...cleared,
        area,
        district: district || null,
        near: "off",
        sort: sortWithoutPoint(),
      }),
    /** Within NEARBY_RADIUS_KM of a point, nearest first. */
    near: (lat: number, lng: number) =>
      navigate({
        ...cleared,
        lat: String(roundCoord(lat)),
        lng: String(roundCoord(lng)),
        sort: "distance",
      }),
  };

  return { searchParams, navigate, location, isPending };
}
