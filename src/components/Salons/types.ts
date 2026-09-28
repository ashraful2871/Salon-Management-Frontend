export type SalonSort = "distance" | "rating" | "newest";

export type NearbyContext = {
  lat: number;
  lng: number;
  radiusKm: number;
  label: string;
};

// Beside the map the list column is narrower, so fewer cards per row.
// SalonsResults and SalonGridSkeleton share these classes.
export const salonGridClass = (nearby: boolean) =>
  nearby
    ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
    : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
