"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, GeoPlace } from "@/lib/api-types";

// `bias` ranks results near that point first. The backend caches lookups, so
// the fetch itself is never cached here.
export const searchPlaces = async (
  q: string,
  bias?: { lat: number; lng: number },
  limit = 5,
): Promise<ApiResponse<GeoPlace[]>> => {
  try {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (bias) {
      params.set("lat", String(bias.lat));
      params.set("lng", String(bias.lng));
    }

    const response = await serverFetch.get(`/geo/search?${params}`, {
      cache: "no-store",
    });

    const result: ApiResponse<GeoPlace[]> = await response.json();
    return result;
  } catch (error) {
    console.error("searchPlaces error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Address search is unavailable right now.",
    };
  }
};
