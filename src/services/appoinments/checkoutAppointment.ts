"use server";

import { serverFetch } from "@/lib/server-fetch";
import type {
  ApiResponse,
  CheckoutReceipt,
  CounterPaymentMethod,
} from "@/lib/api-types";
import { revalidateTag } from "next/cache";

// Completes the booking, applies the held deposit and records what was taken
// at the counter, all in one server transaction. Repeating it returns the same
// receipt, so a double submit cannot take the money twice.
export const checkoutAppointment = async (
  id: string,
  payload: { paymentMethod: CounterPaymentMethod; reference?: string },
): Promise<ApiResponse<CheckoutReceipt>> => {
  try {
    const response = await serverFetch.post(`/appointments/${id}/checkout`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: payload.paymentMethod,
        ...(payload.reference && { reference: payload.reference }),
      }),
    });

    const result: ApiResponse<CheckoutReceipt> = await response.json();

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
    console.error("checkoutAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to complete the appointment.",
    };
  }
};
