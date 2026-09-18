"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { toMinor } from "@/lib/money";

type TopupResponse = {
  redirectUrl: string;
  transactionId: string;
};

export const initiateTopup = async (
  amountTaka: number
): Promise<ApiResponse<TopupResponse>> => {
  try {
    const response = await serverFetch.post("/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountTaka }),
    });
    
    return await response.json();
  } catch (error) {
    console.error("initiateTopup error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to initiate top-up.",
    };
  }
};
