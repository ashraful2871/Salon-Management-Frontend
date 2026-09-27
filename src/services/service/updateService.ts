"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonService } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

export const updateService = async (
  id: string,
  data: {
    name?: string;
    price?: number;
    duration?: number;
    description?: string;
    category?: string;
  },
): Promise<ApiResponse<SalonService>> => {
  try {
    const response = await serverFetch.patch(`/services/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<SalonService> = await response.json();

    if (result.success) {
      updateTag(TAGS.services);
      updateTag(TAGS.myServices);
      revalidateTag(TAGS.mySalons, "max");
      revalidateTag(TAGS.salons, "max");
    }

    return result;
  } catch (error) {
    console.error("updateService error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to update service.",
    };
  }
};
