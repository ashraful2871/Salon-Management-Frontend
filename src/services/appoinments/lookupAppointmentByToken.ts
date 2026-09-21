"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";

// Read at the counter the moment a customer reads out their token, so it is
// never served from cache.
export const lookupAppointmentByToken = async (
  token: string,
): Promise<ApiResponse<Appointment>> => {
  try {
    const response = await serverFetch.get(
      `/appointments/lookup?token=${encodeURIComponent(token.trim())}`,
      { cache: "no-store" },
    );

    const result: ApiResponse<Appointment> = await response.json();
    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("lookupAppointmentByToken error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to look up the booking.",
    };
  }
};
