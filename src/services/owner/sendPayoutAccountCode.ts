"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";

/** `POST /owner/payout-accounts/code`: emails a 6-digit code to the owner. */
export const sendPayoutAccountCode = async (): Promise<
  ApiResponse<{ maskedEmail: string; expiresIn: number }>
> => {
  try {
    const response = await serverFetch.post("/owner/payout-accounts/code", {
      headers: { "Content-Type": "application/json", ...(await clientIpHeaders()) },
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<{ maskedEmail: string; expiresIn: number }>;
  } catch (error) {
    console.error("sendPayoutAccountCode error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't send the code. Please try again.",
    };
  }
};
