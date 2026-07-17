"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";
import type { ApiResponse, Review } from "@/lib/api-types";

export const createReview = async (payload: {
  appointmentId: string;
  rating: number;
  comment: string;
}): Promise<ApiResponse<Review>> => {
  try {
    const response = await serverFetch.post("/reviews", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result: ApiResponse<Review> = await response.json();

    if (result.success) {
      revalidateTag("salons", "seconds");
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
