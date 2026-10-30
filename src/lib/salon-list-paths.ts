/**
 * The pages that render the salon list from the URL and the saved location
 * (components/Salons/SalonsListPage). Saving or clearing a location on one of
 * them starts its list again from that point, rather than refreshing a URL
 * that may still carry an older point or ?near=off.
 */
export const SALON_LIST_PATHS = ["/salons", "/gents-parlour"] as const;

export const isSalonListPath = (pathname: string) =>
  (SALON_LIST_PATHS as readonly string[]).includes(pathname);

/**
 * The Home Service lists (experts and services that reach a point). They need
 * a point to show anything, so a new location restarts them at it with
 * `?lat&lng` only: the radius and sort belong to the salon lists.
 */
export const HOME_LIST_PATHS = ["/home-service/ladies", "/home-service/gents"] as const;

export const isHomeListPath = (pathname: string) =>
  (HOME_LIST_PATHS as readonly string[]).includes(pathname);
