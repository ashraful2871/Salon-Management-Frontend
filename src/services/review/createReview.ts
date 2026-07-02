"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidatePath } from "next/cache";

export const createReview = async (payload: {
  appointmentId: string;
  rating: number;
  comment: string;
}) => {
  try {
    const response = await serverFetch.post("/reviews", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.success) {
      revalidatePath("/salons/[id]", "page");
    }
    return result;
  } catch (error: unknown) {
    console.error(error);
    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? (error as Error)?.message
          : "Something went wrong"
      }`,
    };
  }
};
