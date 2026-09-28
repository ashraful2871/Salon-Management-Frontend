"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse, Review } from "@/lib/api-types";

export const createReview = async (
  payload: {
    appointmentId: string;
    rating: number;
    comment: string;
  },
  salonId?: string,
): Promise<ApiResponse<Review>> => {
  try {
    const response = await serverFetch.post("/reviews", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result: ApiResponse<Review> = await response.json();

    if (result.success) {
      // The salon page shows the new rating; the review prompt reads the
      // customer's completed bookings to know this one is done.
      if (salonId) updateTag(TAGS.salon(salonId));
      updateTag(TAGS.myAppointments);
      revalidateTag(TAGS.salons, "max");
      revalidateTag(TAGS.reviews, "max");
    }

    return result;
  } catch (error) {
    console.error("createReview error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Something went wrong",
    };
  }
};
