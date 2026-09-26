// Pure geo helpers. Keep leaflet out of this file so it stays SSR-safe.

export type LatLng = [lat: number, lng: number];

// [[south, west], [north, east]]. Usable directly as a Leaflet bounds expression.
export const BD_BOUNDS: [LatLng, LatLng] = [
  [20.3, 87.9],
  [26.8, 92.8],
];

export const DHAKA_CENTER: LatLng = [23.8103, 90.4125];

// How far "near me" reaches, in the list, on the map and on the home page.
// Must match NEARBY_MAX_RADIUS_KM on the backend, which clamps to it anyway.
export const NEARBY_RADIUS_KM = 1;

export function roundCoord(n: number, d = 3): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function isInBangladesh(lat: number, lng: number): boolean {
  const [[south, west], [north, east]] = BD_BOUNDS;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= south &&
    lat <= north &&
    lng >= west &&
    lng <= east
  );
}

// 850 m / 1.2 km / 12 km, with a "~" prefix for approximate locations.
export function formatDistance(meters: number, approximate = false): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  const prefix = approximate ? "~" : "";

  const m = meters < 100 ? Math.round(meters) : Math.round(meters / 10) * 10;
  if (m < 1000) return `${prefix}${m} m`;

  const km = meters / 1000;
  if (km < 9.95) return `${prefix}${km.toFixed(1)} km`;
  return `${prefix}${Math.round(km)} km`;
}

// Great-circle distance in meters. Fine for a single display value; lists are
// sorted by the backend (PostGIS), never with this.
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371008.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// "Dhanmondi, Dhaka" from a geocoder place, falling back to the first two
// parts of its label ("Road 27, Dhanmondi, Dhaka" -> "Road 27, Dhanmondi").
export function shortPlaceLabel(place: {
  label: string;
  area?: string;
  district?: string;
  city?: string;
}): string {
  const parts: string[] = [];
  for (const raw of [place.area, place.district || place.city]) {
    const part = raw?.trim();
    if (part && !parts.some((p) => p.toLowerCase() === part.toLowerCase())) {
      parts.push(part);
    }
  }
  if (parts.length === 2) return parts.join(", ");
  const fromLabel = place.label
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return fromLabel || parts.join(", ");
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
