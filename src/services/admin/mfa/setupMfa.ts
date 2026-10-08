"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { MfaSetup } from "../types";

/** `POST /admin/mfa/setup`: a fresh secret as a QR code and a manual key, shown once. */
export const setupMfa = async (): Promise<ApiResponse<MfaSetup>> => {
  try {
    const response = await serverFetch.post("/admin/mfa/setup", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<MfaSetup>;
  } catch (error) {
    console.error("setupMfa error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't start two-factor setup. Please try again.",
    };
  }
};
