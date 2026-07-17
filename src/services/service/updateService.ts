"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonService } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

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
      revalidateTag("services", "seconds");
      revalidateTag("my-services", "seconds");
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
