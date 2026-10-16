import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { SalonCompleteness } from "./catalogue-types";

/** `GET /owner/salons/completeness`: every branch the caller may edit (branch.profile). */
export const getSalonCompleteness = async (): Promise<ApiResponse<SalonCompleteness[]>> => {
  try {
    const response = await serverFetch.get(`/owner/salons/completeness`, {
      next: { revalidate: 300, tags: [TAGS.salonCompleteness] },
    });
    return (await response.json()) as ApiResponse<SalonCompleteness[]>;
  } catch (error) {
    console.error("getSalonCompleteness error:", error);
    return {
      success: false,
      message: process.env.NODE_ENV === "development" ? (error as Error).message : "Couldn't load profile scores.",
    };
  }
};
