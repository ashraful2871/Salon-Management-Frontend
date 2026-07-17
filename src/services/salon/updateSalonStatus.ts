"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";

export const updateSalonStatus = async (
  id: string,
  status: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await serverFetch.patch(`/salons/${id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result: ApiResponse<null> = await res.json();

    if (result.success) {
      revalidateTag("salons", "seconds");
      revalidateTag(`salon-${id}`, "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Error updating salon status:", error);

    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to update salon status. Please try again.",
    };
  }
};
