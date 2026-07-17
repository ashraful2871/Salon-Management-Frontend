"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";

export const approveApplication = async (
  applicationId: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await serverFetch.patch(
      `/become-salon-owner/applications/${applicationId}/approve`,
    );

    const result: ApiResponse<null> = await res.json();

    if (result.success) {
      revalidateTag("salon-applications", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Error approving application:", error);

    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to approve application. Please try again.",
    };
  }
};
