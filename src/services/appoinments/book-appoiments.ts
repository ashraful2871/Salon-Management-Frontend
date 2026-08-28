"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const bookingAppointment = async (
  _currentState: ApiResponse<Appointment> | null,
  formData: FormData,
): Promise<ApiResponse<Appointment>> => {
  try {
    const appointmentData = {
      salonId: formData.get("salonId")?.toString(),
      serviceId: formData.get("serviceId")?.toString(),
      staffId: formData.get("staffId")?.toString(),
      counterId: formData.get("counterId")?.toString(),
      slotId: formData.get("slotId")?.toString(),
      notes: formData.get("notes")?.toString() || undefined,
    };

    const res = await serverFetch.post("/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData),
    });

    const result: ApiResponse<Appointment> = await res.json();

    if (result.success) {
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("bookingAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to book appointment.",
    };
  }
};
