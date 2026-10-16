"use server";

import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { BookingPauseState, CreateClosureResult } from "./schedule-types";

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

// The owner sees the closure list now; the public salon page, slot lists and
// the calendar pick it up in the background.
const expireClosures = (salonId: string) => {
  updateTag(TAGS.salonClosures(salonId));
  revalidateTag(TAGS.salon(salonId), "max");
  revalidateTag(TAGS.slots, "max");
  revalidateTag(TAGS.salonCompleteness, "max");
};

/** `POST /salons/:id/closures`. Bookings already inside it come back, never cancelled. */
export const createClosure = async (
  salonId: string,
  body: { date: string; allDay: boolean; startTime?: string; endTime?: string; reason: string },
): Promise<ApiResponse<CreateClosureResult>> => {
  try {
    const response = await serverFetch.post(`/salons/${encodeURIComponent(salonId)}/closures`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<CreateClosureResult>;
    if (result.success) expireClosures(salonId);
    return result;
  } catch (error) {
    console.error("createClosure error:", error);
    return failure(error, "Couldn't add the closure. Please try again.");
  }
};

/** `DELETE /salons/:id/closures/:closureId`; the slots it blocked reopen. */
export const deleteClosure = async (
  salonId: string,
  closureId: string,
): Promise<ApiResponse<{ id: string; reopenedSlots: number }>> => {
  try {
    const response = await serverFetch.delete(
      `/salons/${encodeURIComponent(salonId)}/closures/${encodeURIComponent(closureId)}`,
      { cache: "no-store" },
    );
    const result = (await response.json()) as ApiResponse<{ id: string; reopenedSlots: number }>;
    if (result.success) expireClosures(salonId);
    return result;
  } catch (error) {
    console.error("deleteClosure error:", error);
    return failure(error, "Couldn't remove the closure. Please try again.");
  }
};

const expirePause = (salonId: string) => {
  updateTag(TAGS.salonPause(salonId));
  revalidateTag(TAGS.salon(salonId), "max");
  revalidateTag(TAGS.salons, "max");
  revalidateTag(TAGS.mySalons, "max");
  revalidateTag(TAGS.ownerHomes, "max");
};

/** `POST /salons/:id/pause`. A DUES pause answers `errorCode: "DUES_PAUSED"`. */
export const pauseBookings = async (
  salonId: string,
  body: { reason: string; until?: string },
): Promise<ApiResponse<BookingPauseState>> => {
  try {
    const response = await serverFetch.post(`/salons/${encodeURIComponent(salonId)}/pause`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<BookingPauseState>;
    if (result.success) expirePause(salonId);
    return result;
  } catch (error) {
    console.error("pauseBookings error:", error);
    return failure(error, "Couldn't pause bookings. Please try again.");
  }
};

/** `DELETE /salons/:id/pause`. */
export const resumeBookings = async (salonId: string): Promise<ApiResponse<BookingPauseState>> => {
  try {
    const response = await serverFetch.delete(`/salons/${encodeURIComponent(salonId)}/pause`, { cache: "no-store" });
    const result = (await response.json()) as ApiResponse<BookingPauseState>;
    // A refused resume may have turned the pause into DUES: re-read either way.
    expirePause(salonId);
    return result;
  } catch (error) {
    console.error("resumeBookings error:", error);
    return failure(error, "Couldn't resume bookings. Please try again.");
  }
};
