"use server";
import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const updateSalonStatus = async (id: string, status: string) => {
  try {
    const res = await serverFetch.patch(`/salons/${id}/status`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const result = await res.json();
    revalidateTag("salons", "default");
    return result;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Error updating salon status:", error);

    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to update salon status. Please try again."
      }`,
    };
  }
};
