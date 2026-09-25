"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Bbox, SalonMarkersResult } from "@/lib/api-types";

// Server action for the /salons map. Every box is different, so caching the
// fetch would only fill the data cache.
export const getSalonMarkers = async (
  bbox: Bbox,
): Promise<ApiResponse<SalonMarkersResult>> => {
  try {
    const coords = bbox.map(Number);
    if (coords.length !== 4 || !coords.every(Number.isFinite)) {
      return { success: false, message: "Invalid map area." };
    }
    const params = new URLSearchParams({
      bbox: coords.map((n) => n.toFixed(5)).join(","),
    });

    const response = await serverFetch.get(`/salons/map?${params}`, {
      cache: "no-store",
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
