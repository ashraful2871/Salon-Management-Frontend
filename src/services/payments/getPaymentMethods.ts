"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { ProviderId } from "@/lib/payment-providers";

/**
 * Mirrors `GET /payments/methods`: every gateway the backend knows, bKash
 * first, with `enabled` reflecting its kill switch right now. Limits are per
 * method; `min` / `max` are the taka twins `addTakaFields` adds.
 */
export type PaymentMethodOption = {
  id: ProviderId;
  name: string;
  description: string;
  enabled: boolean;
  /** Sandbox credentials: no real money moves. */
  testMode: boolean;
  minMinor: number;
  maxMinor: number;
  /** Taka twins added by `addTakaFields`. */
  min: number;
  max: number;
};

export const getPaymentMethods = async (): Promise<
  ApiResponse<PaymentMethodOption[]>
> => {
  try {
    // Not cached: turning a gateway off has to reach the dialog at once.
    const response = await serverFetch.get("/payments/methods", {
      cache: "no-store",
    });
    return await response.json();
  } catch (error) {
    console.error("getPaymentMethods error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load payment methods.",
    };
  }
};
