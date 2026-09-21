"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const checkInAppointment = async (
  id: string,
): Promise<ApiResponse<Appointment>> => {
  try {
    const response = await serverFetch.patch(`/appointments/${id}/check-in`, {
      headers: { "Content-Type": "application/json" },
    });

    const result: ApiResponse<Appointment> = await response.json();

    if (result.success) {
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
      revalidateTag("dashboard-stats", "seconds");
      revalidateTag("earnings", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("checkInAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to check in the appointment.",
    };
  }
};
