"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const deleteService = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(`/services/${id}`, {
      method: "DELETE",
    });

    const result: ApiResponse<null> = await response.json();

    if (result.success) {
      revalidateTag("services", "seconds");
      revalidateTag("my-services", "seconds");
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
