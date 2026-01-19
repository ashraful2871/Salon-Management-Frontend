"use server";
import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const approveApplication = async (applicationId: string) => {
  try {
    const res = await serverFetch.patch(
      `/become-salon-owner/applications/${applicationId}/approve`
    );

    const result = await res.json();
    revalidateTag("salon-applications", "default");
    return result;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Error updating event:", error);

    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to update event. Please try again."
      }`,
    };
  }
};
