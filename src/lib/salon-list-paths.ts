/**
 * The pages that render the salon list from the URL and the saved location
 * (components/Salons/SalonsListPage). Saving or clearing a location on one of
 * them starts its list again from that point, rather than refreshing a URL
 * that may still carry an older point or ?near=off.
 */
export const SALON_LIST_PATHS = ["/salons", "/gents-parlour"] as const;

export const isSalonListPath = (pathname: string) =>
  (SALON_LIST_PATHS as readonly string[]).includes(pathname);
