"use client";

import { useCallback, useState } from "react";

import { useGeolocation } from "@/hooks/useGeolocation";
import { isInBangladesh, roundCoord, shortPlaceLabel } from "@/lib/geo";
import { saveLocation, type SavedLocation } from "@/lib/location-cookie";
import { reversePlace } from "@/services/geo/reversePlace";

// One-tap "use my location" for buttons outside LocationDialog: GPS, a place
// name for the label, then the sm_loc cookie. Resolves to null when the
// browser refused, failed, or put the customer outside Bangladesh; callers
// open LocationDialog then, which explains and offers search instead.
export function useLocateAndSave() {
  const geo = useGeolocation();
  const { locate: getCoords } = geo;
  const [resolving, setResolving] = useState(false);

  const locate = useCallback(async (): Promise<SavedLocation | null> => {
    const coords = await getCoords();
    if (!coords || !isInBangladesh(coords.lat, coords.lng)) return null;

    const lat = roundCoord(coords.lat);
    const lng = roundCoord(coords.lng);
    setResolving(true);
    const res = await reversePlace(lat, lng);
    setResolving(false);
    const label =
      (res.success && res.data && shortPlaceLabel(res.data)) ||
      "Current location";
    return saveLocation({ lat, lng, label, source: "gps" });
  }, [getCoords]);

  return {
    locate,
    busy: geo.status === "locating" || resolving,
    // Skip straight to the dialog when asking is pointless.
    canAsk: geo.supported && !geo.deniedBefore,
  };
}
