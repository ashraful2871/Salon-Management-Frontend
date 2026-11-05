export type SalonSort = "distance" | "rating" | "newest";

/** What a list page calls its salons, in its counts and empty states. */
export type ListNoun = { one: string; many: string };
export const SALON_NOUN: ListNoun = { one: "salon", many: "salons" };

export type NearbyContext = {
  lat: number;
  lng: number;
  radiusKm: number;
  label: string;
};

/**
 * Where a list page is looking, read from the URL and the sm_loc cookie on
 * the server. The three are exclusive: picking an area drops the point (a
 * 1 km circle around Dhanmondi has nothing in Uttara), picking a point drops
 * the area.
 *
 * - `all`: every salon (optionally narrowed by an older ?district= link).
 * - `area`: one of the areas GET /salons/areas listed (?area=&district=).
 * - `near`: within NEARBY_RADIUS_KM of a point (?lat&lng, or the cookie).
 */
export type ListLocation =
  | { kind: "all"; district?: string; division?: string }
  | { kind: "area"; area: string; district?: string }
  | {
      kind: "near";
      lat: number;
      lng: number;
      label?: string;
      /** The point came from the saved location, not from the URL. */
      fromCookie: boolean;
    };

/** The words for a location in a title, a chip or a count. */
export const locationName = (loc: ListLocation): string | null => {
  if (loc.kind === "area") return loc.area;
  if (loc.kind === "near") return loc.label?.split(",")[0]?.trim() || null;
  return loc.district || loc.division || null;
};

// Beside the map the list column is narrower, so fewer cards per row.
// SalonsResults and SalonGridSkeleton share these classes.
export const salonGridClass = (withMap: boolean) =>
  withMap
    ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
    : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
