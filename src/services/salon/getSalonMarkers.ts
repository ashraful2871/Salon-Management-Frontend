"use server";

import { serverFetch } from "@/lib/server-fetch";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type {
  ApiResponse,
  Bbox,
  SalonMarkerFilters,
  SalonMarkersResult,
} from "@/lib/api-types";

// Server action for the salon list maps. Every box is different, so caching
// the fetch would only fill the data cache. `near` limits the pins to the
// same reach as the list beside the map; `filters` are the list's own, so a
// pin is always a salon the list would show.
export const getSalonMarkers = async (
  bbox: Bbox,
  near?: { lat: number; lng: number; radiusKm: number },
  filters: SalonMarkerFilters = {},
): Promise<ApiResponse<SalonMarkersResult>> => {
  try {
    const coords = bbox.map(Number);
    if (coords.length !== 4 || !coords.every(Number.isFinite)) {
      return { success: false, message: "Invalid map area." };
    }
    const params = new URLSearchParams({
      bbox: coords.map((n) => n.toFixed(5)).join(","),
    });
    if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
      params.set("lat", String(near.lat));
      params.set("lng", String(near.lng));
      params.set("radiusKm", String(near.radiusKm));
    }
    for (const key of ["searchTerm", "area", "district", "division", "category", "audience"] as const) {
      const value = filters[key]?.trim();
      if (value) params.set(key, value);
    }
    if (filters.audience && filters.includeUnisex === false)
      params.set("includeUnisex", "false");

    // The map limiter is per visitor (contract 4).
    const response = await serverFetch.get(`/salons/map?${params}`, {
      cache: "no-store",
      headers: await clientIpHeaders(),
    });

    const result: ApiResponse<SalonMarkersResult> = await response.json();
    return result;
  } catch (error) {
    console.error("getSalonMarkers error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load the map. Please try again.",
    };
  }
};
