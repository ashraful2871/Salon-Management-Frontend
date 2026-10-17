import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { BookingPauseState } from "./schedule-types";

/** `GET /salons/:id/pause` (the branch's owner only; 404 for anyone else). */
export const getBookingPause = async (salonId: string): Promise<ApiResponse<BookingPauseState>> => {
  try {
    const response = await serverFetch.get(`/salons/${encodeURIComponent(salonId)}/pause`, {
      next: { revalidate: 60, tags: [TAGS.salonPause(salonId)] },
    });
    return (await response.json()) as ApiResponse<BookingPauseState>;
  } catch (error) {
    console.error("getBookingPause error:", error);
    return {
      success: false,
      message: process.env.NODE_ENV === "development" ? (error as Error).message : "Couldn't load the booking status.",
    };
  }
};
