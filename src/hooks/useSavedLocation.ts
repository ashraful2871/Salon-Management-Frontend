"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  LOCATION_CHANGE_EVENT,
  parseSavedLocation,
  readLocationCookie,
  type SavedLocation,
} from "@/lib/location-cookie";

// Re-read on our own writes, and on focus so a change made in another tab
// shows up when the customer comes back.
function subscribe(onChange: () => void) {
  window.addEventListener(LOCATION_CHANGE_EVENT, onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(LOCATION_CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

// The `sm_loc` cookie as seen by the client. Null during SSR and hydration,
// then the saved value once mounted.
export function useSavedLocation(): SavedLocation | null {
  const raw = useSyncExternalStore(subscribe, readLocationCookie, () => "");
  return useMemo(() => parseSavedLocation(raw), [raw]);
}
