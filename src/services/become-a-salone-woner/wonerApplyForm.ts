"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonApplication } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

export const ownerApplyForm = async (
  _currentState: ApiResponse<SalonApplication> | null,
  formData: FormData,
): Promise<ApiResponse<SalonApplication>> => {
  try {
    const payload = {
      businessName: formData.get("businessName")?.toString(),
      businessAddress: formData.get("businessAddress")?.toString(),
      businessPhone: formData.get("businessPhone")?.toString(),
      businessEmail: formData.get("businessEmail")?.toString(),
      documentUrl: formData.get("documentUrl")?.toString(),
    };

    const res = await serverFetch.post(`/become-salon-owner/apply`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<SalonApplication> = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result.message || "Failed to submit application.",
      };
    }

    if (result.success) {
      updateTag(TAGS.salonApplications);
      updateTag(TAGS.applicationsStatus);
      revalidateTag(TAGS.users, "max");
    }

    return {
      success: true,
      message: result.message || "Application submitted successfully",
      data: result.data,
    };
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("ownerApplyForm error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to submit application.",
    };
  }
};
