// The customer's chosen search location. Server components read it with
// `(await cookies()).get(LOCATION_COOKIE)`; the client writes it. It never
// reaches the database, and coordinates are rounded to ~110 m before they are
// stored or sent anywhere.

import { isInBangladesh, roundCoord } from "./geo";

export const LOCATION_COOKIE = "sm_loc";
export const LOCATION_CHANGE_EVENT = "sm_loc:change";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const MAX_LABEL_LENGTH = 80;
const SOURCES = ["gps", "search", "area"] as const;

export type LocationSource = (typeof SOURCES)[number];

export type SavedLocation = {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
};

// Accepts the raw `document.cookie` value (URI-encoded) as well as the value
// Next's `cookies()` hands back (already decoded).
export function parseSavedLocation(raw?: string | null): SavedLocation | null {
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : decodeURIComponent(raw);
    const value = JSON.parse(text) as Partial<SavedLocation>;
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    if (!isInBangladesh(lat, lng)) return null;

    const label =
      typeof value.label === "string" && value.label.trim()
        ? value.label.trim().slice(0, MAX_LABEL_LENGTH)
        : "Current location";
    const source = SOURCES.includes(value.source as LocationSource)
      ? (value.source as LocationSource)
      : "search";

    return { lat: roundCoord(lat), lng: roundCoord(lng), label, source };
  } catch {
    return null;
  }
}

function writeCookie(value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCATION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

// Client only. Returns what was stored, or null if the location was rejected
// (outside Bangladesh).
export function saveLocation(loc: SavedLocation): SavedLocation | null {
  const clean = parseSavedLocation(JSON.stringify(loc));
  if (!clean) return null;
  writeCookie(encodeURIComponent(JSON.stringify(clean)), MAX_AGE_SECONDS);
  return clean;
}

// Client only.
export function clearLocation() {
  writeCookie("", 0);
}

// Client only: the raw cookie value, or "" when none is set.
export function readLocationCookie(): string {
  const prefix = `${LOCATION_COOKIE}=`;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : "";
}
