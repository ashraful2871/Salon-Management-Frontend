"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

export const rescheduleAppointment = async (
  id: string,
  slotId: string,
): Promise<ApiResponse<Appointment>> => {
  try {
    const response = await serverFetch.patch(`/appointments/${id}/reschedule`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
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
    console.error("rescheduleAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to move the booking.",
    };
  }
};
