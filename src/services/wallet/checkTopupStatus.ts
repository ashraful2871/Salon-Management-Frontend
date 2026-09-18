"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

type TopupStatus = {
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED";
};

export const checkTopupStatus = async (
  transactionId: string
): Promise<ApiResponse<TopupStatus>> => {
  try {
    const response = await serverFetch.get(`/wallet/topup/${transactionId}/status`);
    return await response.json();
  } catch (error) {
    console.error("checkTopupStatus error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to check top-up status.",
    };
  }
};
