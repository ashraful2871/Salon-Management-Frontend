"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, CounterPaymentMethod } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

// For a booking completed without its counter payment being written down. The
// server works out the amount, so only the method is sent.
export const recordPayment = async (
  appointmentId: string,
  paymentMethod: CounterPaymentMethod,
): Promise<ApiResponse<unknown>> => {
  try {
    const response = await serverFetch.post(`/payments`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, paymentMethod }),
    });

    const result: ApiResponse<unknown> = await response.json();

    if (result.success) {
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
      revalidateTag("dashboard-stats", "seconds");
      revalidateTag("earnings", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("recordPayment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to record the payment.",
    };
  }
};
