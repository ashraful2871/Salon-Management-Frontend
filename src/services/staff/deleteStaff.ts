"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const deleteStaff = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(`/staff/${id}`, {
      method: "DELETE",
    });

    const result: ApiResponse<null> = await response.json();

    if (result.success) {
      revalidateTag("staff", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("deleteStaff error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to remove staff.",
    };
  }
};
