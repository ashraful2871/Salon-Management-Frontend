"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const startAppointment = async (
  id: string,
): Promise<ApiResponse<Appointment>> => {
  try {
    const response = await serverFetch.patch(`/appointments/${id}/start`, {
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
    console.error("startAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to start the appointment.",
    };
  }
};
