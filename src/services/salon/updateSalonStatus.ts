"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
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
      updateTag(TAGS.salons);
      revalidateTag(TAGS.salon(id), "max");
      updateTag(TAGS.salonApplications);
      revalidateTag(TAGS.mySalons, "max");
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
