"use server";

import { revalidateTag } from "next/cache";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantAction, AssistantTurn } from "@/lib/assistant-types";
import {
  assistantErrorMessage,
  assistantHeaders,
  normalizeTurn,
} from "@/lib/assistant-request";

/**
 * One guided turn. `label` is the chip's own words: the API keeps it as the
 * text of the customer's message, so a transcript reopened on another device
 * reads the way it did when it was tapped.
 *
 * No cache. Two taps write something a cached server component renders — a
 * cancellation and a review — so those revalidate the same tags
 * `cancelAppointment` and `createReview` do. Every other tap is read-only.
 */
export const sendAssistantAction = async (
  conversationId: string,
  action: AssistantAction,
  label?: string,
): Promise<ApiResponse<AssistantTurn>> => {
  try {
    const response = await serverFetch.post(
      `/assistant/conversations/${conversationId}/actions`,
      {
        headers: await assistantHeaders(),
        body: JSON.stringify({ action, ...(label ? { label } : {}) }),
        cache: "no-store",
      },
    );

    const result = (await response.json()) as ApiResponse<
      AssistantTurn & { id?: string }
    >;

    if (!result.success || !result.data) return result;

    if (action.type === "cancel_confirm") {
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
      revalidateTag("dashboard-stats", "seconds");
      revalidateTag("earnings", "seconds");
      revalidateTag("slots", "max");
    } else if (action.type === "rate_booking") {
      revalidateTag("salons", "seconds");
      revalidateTag("my-appointments", "seconds");
    }

    return {
      ...result,
      data: {
        ...normalizeTurn(result.data, conversationId),
        anonymousId: null,
      },
    };
  } catch (error) {
    console.error("Error running assistant action:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
