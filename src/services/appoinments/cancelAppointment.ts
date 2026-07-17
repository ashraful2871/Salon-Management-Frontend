"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const cancelAppointment = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(`/appointments/${id}`, {
      method: "DELETE",
    });

    const result: ApiResponse<null> = await response.json();

    if (result.success) {
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("cancelAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to cancel appointment.",
    };
  }
};
