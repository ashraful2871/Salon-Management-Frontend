"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Salon, SalonQuery } from "@/lib/api-types";
import { isInBangladesh, roundCoord } from "@/lib/geo";

// Server action for client components (the home "near you" strip). Nearby
// results are per point, so the fetch is never cached.
export const getNearbySalons = async (
  query: Required<Pick<SalonQuery, "lat" | "lng">> &
    Pick<SalonQuery, "radiusKm" | "limit" | "sort">,
): Promise<ApiResponse<Salon[]>> => {
  try {
    const lat = Number(query.lat);
    const lng = Number(query.lng);
    if (!isInBangladesh(lat, lng)) {
      return { success: false, message: "Choose a location in Bangladesh." };
    }

    const params = new URLSearchParams({
      lat: String(roundCoord(lat)),
      lng: String(roundCoord(lng)),
      sort: query.sort ?? "distance",
    });
    if (query.radiusKm != null) params.set("radiusKm", String(query.radiusKm));
    if (query.limit != null) params.set("limit", String(query.limit));

    const response = await serverFetch.get(`/salons?${params}`, {
      cache: "no-store",
    });

    const result: ApiResponse<Salon[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getNearbySalons error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load salons. Please try again.",
    };
  }
};
