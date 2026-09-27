"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { dhakaToday } from "@/components/Dashboard/appointments/format";

// The desk's live queue poll: the same request the appointments page makes for
// today's queue, but never from the data cache, since the poll is there to see
// bookings the cache hasn't.
export const getTodayQueue = async (): Promise<ApiResponse<Appointment[]>> => {
  try {
    const query = new URLSearchParams({ date: dhakaToday(), limit: "100" });
    const response = await serverFetch.get(`/appointments?${query}`, {
      cache: "no-store",
    });

    const result: ApiResponse<Appointment[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getTodayQueue error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load today's queue.",
    };
  }
};
