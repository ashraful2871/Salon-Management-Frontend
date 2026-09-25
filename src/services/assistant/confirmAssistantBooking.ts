"use server";

import { randomUUID } from "crypto";
import { revalidateTag } from "next/cache";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantConfirmResult } from "@/lib/assistant-types";
import {
  assistantErrorMessage,
  assistantHeaders,
} from "@/lib/assistant-request";

/**
 * The one call in the assistant that books. Everything it sends is a signed
 * quote the server built and a key to make the request replayable: the API
 * re-runs every check itself, so this is a tap being relayed, not a decision
 * being made here.
 *
 * A failure still carries blocks — a lost slot, an empty wallet, a price that
 * moved — so the caller renders the answer rather than an error banner.
 */
export const confirmAssistantBooking = async (
  confirmationToken: string,
  notes?: string,
): Promise<ApiResponse<AssistantConfirmResult>> => {
  try {
    const response = await serverFetch.post("/assistant/bookings/confirm", {
      headers: {
        ...(await assistantHeaders()),
        // Fresh per attempt. The server remembers the key it booked with, so a
        // retried request carrying the same one returns the same appointment
        // instead of a second booking.
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        confirmationToken,
        ...(notes ? { notes } : {}),
      }),
      cache: "no-store",
    });

    const result = (await response.json()) as ApiResponse<AssistantConfirmResult>;

    if (result.success) {
      // Exactly what a booking invalidates, copied from `book-appoiments.ts`.
      // Miss one and the owner's dashboard will not show a booking the
      // customer can already see in the chat.
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
      revalidateTag("dashboard-stats", "seconds");
      revalidateTag("earnings", "seconds");
      revalidateTag("slots", "max");
    }

    return result;
  } catch (error) {
    console.error("Error confirming assistant booking:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
