"use server";

import { revalidateTag } from "next/cache";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantTurn } from "@/lib/assistant-types";
import {
  assistantErrorMessage,
  assistantHeaders,
  normalizeTurn,
} from "@/lib/assistant-request";

/**
 * A typed message. The API reads it with rules first and asks the model only
 * when it has to, then answers with the same turn envelope as a tap, plus
 * `mode` ("guided" when no model was involved) and `toolLabel`.
 *
 * "Did my payment go through?" is answered by the payment check on the API
 * side, which can finish a "Top up & book" — so a reply carrying an
 * `appointmentId` owes the same invalidation the Confirm button does.
 */
export const sendAssistantMessage = async (
  conversationId: string,
  text: string,
): Promise<ApiResponse<AssistantTurn>> => {
  try {
    const response = await serverFetch.post(
      `/assistant/conversations/${conversationId}/messages`,
      {
        headers: await assistantHeaders(),
        body: JSON.stringify({ text }),
        cache: "no-store",
      },
    );

    const result = (await response.json()) as ApiResponse<
      AssistantTurn & { id?: string; appointmentId?: string }
    >;

    if (!result.success || !result.data) return result;

    if (result.data.appointmentId) {
      revalidateTag("appointments", "seconds");
      revalidateTag("my-appointments", "seconds");
      revalidateTag("dashboard-stats", "seconds");
      revalidateTag("earnings", "seconds");
      revalidateTag("slots", "max");
    }

    return {
      ...result,
      data: {
        ...normalizeTurn(result.data, conversationId),
        anonymousId: null,
        mode: result.data.mode ?? "guided",
        ...(result.data.toolLabel ? { toolLabel: result.data.toolLabel } : {}),
      },
    };
  } catch (error) {
    console.error("Error sending assistant message:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
