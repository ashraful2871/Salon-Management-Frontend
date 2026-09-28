"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

export const deleteService = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(`/services/${id}`, {
      method: "DELETE",
    });

    const result: ApiResponse<null> = await response.json();

    if (result.success) {
      updateTag(TAGS.services);
      updateTag(TAGS.myServices);
      revalidateTag(TAGS.mySalons, "max");
      revalidateTag(TAGS.salons, "max");
    }

    return result;
  } catch (error) {
    console.error("deleteService error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to delete service.",
    };
  }
};
