import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { SalonClosure } from "./schedule-types";

/** `GET /salons/:id/closures` (slots.manage; 404 otherwise). Last 30 days onward. */
export const getClosures = async (salonId: string): Promise<ApiResponse<SalonClosure[]>> => {
  try {
    const response = await serverFetch.get(`/salons/${encodeURIComponent(salonId)}/closures`, {
      next: { revalidate: 60, tags: [TAGS.salonClosures(salonId)] },
    });
    return (await response.json()) as ApiResponse<SalonClosure[]>;
  } catch (error) {
    console.error("getClosures error:", error);
    return {
      success: false,
      message: process.env.NODE_ENV === "development" ? (error as Error).message : "Couldn't load closures.",
    };
  }
};
