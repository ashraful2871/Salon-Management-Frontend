"use server";

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
 * No cache and no `revalidateTag`: nothing this phase writes is rendered by a
 * cached server component. Phase 4 books, and that one will need both.
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
