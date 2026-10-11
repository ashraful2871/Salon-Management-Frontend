"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/** `POST /admin/mfa/step-up`: a fresh code opens the 10-minute window for tier-3 actions. */
export const stepUp = async (code: string): Promise<ApiResponse<{ stepUpUntil: string }>> => {
  try {
    const response = await serverFetch.post("/admin/mfa/step-up", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<{ stepUpUntil: string }>;
  } catch (error) {
    console.error("stepUp error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't check that code. Please try again.",
    };
  }
};
