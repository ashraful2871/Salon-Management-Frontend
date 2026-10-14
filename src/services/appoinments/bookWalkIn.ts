"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

export const bookWalkIn = async (
  payload: { slotId: string; customerName: string; customerPhone: string; notes?: string },
): Promise<ApiResponse<Appointment>> => {
  try {
    const response = await serverFetch.post(`/appointments/walk-in`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<Appointment> = await response.json();

    if (result.success) {
      updateTag(TAGS.appointments);
      updateTag(TAGS.slots);
      updateTag(TAGS.dashboardStats);
      updateTag(TAGS.ownerHomes);
      revalidateTag(TAGS.myAppointments, "max");
      revalidateTag(TAGS.earnings, "max");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("bookWalkIn error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to book the walk-in.",
    };
  }
};
