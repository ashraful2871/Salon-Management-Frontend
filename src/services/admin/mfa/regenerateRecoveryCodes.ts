"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { RecoveryCodes } from "../types";

/** `POST /admin/mfa/recovery-codes` (tier 3, needs step-up): new codes; every older one stops working. */
export const regenerateRecoveryCodes = async (): Promise<ApiResponse<RecoveryCodes>> => {
  try {
    const response = await serverFetch.post("/admin/mfa/recovery-codes", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<RecoveryCodes>;
  } catch (error) {
    console.error("regenerateRecoveryCodes error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't create new recovery codes. Please try again.",
    };
  }
};
