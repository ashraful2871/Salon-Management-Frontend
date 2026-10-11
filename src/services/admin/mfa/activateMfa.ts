"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { RecoveryCodes } from "../types";

/** `POST /admin/mfa/activate`: the first right code turns 2FA on and returns the recovery codes, once. */
export const activateMfa = async (code: string): Promise<ApiResponse<RecoveryCodes & { stepUpUntil: string }>> => {
  try {
    const response = await serverFetch.post("/admin/mfa/activate", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<RecoveryCodes & { stepUpUntil: string }>;
  } catch (error) {
    console.error("activateMfa error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't check that code. Please try again.",
    };
  }
};
