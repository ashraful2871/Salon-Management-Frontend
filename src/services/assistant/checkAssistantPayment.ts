"use server";

import { revalidateTag } from "next/cache";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantPaymentCheck } from "@/lib/assistant-types";
import {
  CHAT_RESUME_COOKIE,
  assistantErrorMessage,
  assistantHeaders,
  normalizeTurn,
} from "@/lib/assistant-request";
import { deleteCookie } from "@/services/auth/cookiesHandler";

/**
 * `check_payment`, on its own path rather than `sendAssistantAction`: when the
 * payment lands on a "Top up & book", this call is what books, so it owes the
 * same cache invalidation the Confirm button does.
 *
 * No `label` is a background poll; the API writes nothing for one that finds
 * the payment still pending and answers `recorded: false`.
 */
export const checkAssistantPayment = async (
  conversationId: string,
  label?: string,
): Promise<ApiResponse<AssistantPaymentCheck>> => {
  try {
    const response = await serverFetch.post(
      `/assistant/conversations/${conversationId}/actions`,
      {
        headers: await assistantHeaders(),
        body: JSON.stringify({
          action: { type: "check_payment" },
          ...(label ? { label } : {}),
        }),
        cache: "no-store",
      },
    );

    const result = (await response.json()) as ApiResponse<
      AssistantPaymentCheck & { id?: string }
    >;

    if (!result.success || !result.data) return result;

    const data = result.data;

    if (data.appointmentId) {
      // Exactly what `confirmAssistantBooking` invalidates.
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
      revalidateTag("dashboard-stats", "seconds");
      revalidateTag("earnings", "seconds");
      revalidateTag("slots", "max");
    }

    // Settled one way or the other: the wallet page has nothing to lead back
    // to any more.
    if (!data.state?.pendingTopup) await deleteCookie(CHAT_RESUME_COOKIE);

    return {
      ...result,
      data: {
        ...normalizeTurn(data, conversationId),
        anonymousId: null,
        recorded: data.recorded !== false,
        payment: data.payment ?? null,
        ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
      },
    };
  } catch (error) {
    console.error("Error checking assistant payment:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
