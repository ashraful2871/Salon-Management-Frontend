"use server";

import { serverFetch } from "@/lib/server-fetch";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { ApiResponse, GeoPlace } from "@/lib/api-types";

// The backend caches lookups, so the fetch itself is never cached here.
export const reversePlace = async (
  lat: number,
  lng: number,
): Promise<ApiResponse<GeoPlace>> => {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });

    // The geo limiter is per visitor (contract 4).
    const response = await serverFetch.get(`/geo/reverse?${params}`, {
      cache: "no-store",
      headers: await clientIpHeaders(),
    });

    const result: ApiResponse<GeoPlace> = await response.json();
    return result;
  } catch (error) {
    console.error("reversePlace error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Address lookup is unavailable right now.",
    };
  }
};
