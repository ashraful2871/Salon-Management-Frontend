"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { ProviderId } from "@/lib/payment-providers";

type PayDuesResponse = {
  redirectUrl: string;
  transactionId: string;
  amountMinor: number;
};

/**
 * `POST /owner/dues/pay`: the server decides the amount (the current dues) and
 * answers with the gateway URL. The gateway returns to
 * `/dashboard/money?dues=success|failed|cancelled`.
 */
export const payDues = async (provider: ProviderId): Promise<ApiResponse<PayDuesResponse>> => {
  try {
    const response = await serverFetch.post("/owner/dues/pay", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    return (await response.json()) as ApiResponse<PayDuesResponse>;
  } catch (error) {
    console.error("payDues error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Could not start the payment. Please try again.",
    };
  }
};
