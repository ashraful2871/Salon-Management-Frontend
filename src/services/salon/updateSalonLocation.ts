"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";
import type { ApiResponse, Salon } from "@/lib/api-types";

// Only moves the pin (and marks it EXACT). Deliberately separate from
// updateSalon, which resends every field and would reset operating hours.
export const updateSalonLocation = async (
  id: string,
  latitude: number,
  longitude: number,
): Promise<ApiResponse<Salon>> => {
  try {
    const res = await serverFetch.patch(`/salons/${id}/location`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });

    const result: ApiResponse<Salon> = await res.json();

    if (result.success) {
      revalidateTag("salons", "seconds");
      revalidateTag(`salon-${id}`, "seconds");
      revalidateTag("my-salons", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Error updating salon location:", error);

    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to save the location. Please try again.",
    };
  }
};
