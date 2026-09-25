"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantTurn } from "@/lib/assistant-types";
import {
  assistantErrorMessage,
  assistantHeaders,
  normalizeTurn,
} from "@/lib/assistant-request";

/**
 * The whole transcript, for resuming a chat after a reload or a navigation
 * inside the site. A conversation the caller does not own answers 404, which
 * comes back here as `success: false` and sends the widget to a fresh chat.
 */
export const getConversation = async (
  conversationId: string,
): Promise<ApiResponse<AssistantTurn>> => {
  try {
    const response = await serverFetch.get(
      `/assistant/conversations/${conversationId}`,
      { headers: await assistantHeaders(), cache: "no-store" },
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
    console.error("Error loading assistant conversation:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
