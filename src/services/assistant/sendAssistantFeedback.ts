"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import {
  assistantErrorMessage,
  assistantHeaders,
} from "@/lib/assistant-request";

/**
 * 👍 / 👎 on one assistant message. Sent with the same owner headers as a
 * turn, so a guest can rate their own chat and nobody can rate anyone else's.
 */
export const sendAssistantFeedback = async (
  messageId: string,
  value: 1 | -1,
  reason?: string,
): Promise<ApiResponse<{ id: string; feedback: number | null }>> => {
  try {
    const response = await serverFetch.post(
      `/assistant/messages/${messageId}/feedback`,
      {
        headers: await assistantHeaders(),
        body: JSON.stringify({ value, ...(reason ? { reason } : {}) }),
        cache: "no-store",
      },
    );

    return (await response.json()) as ApiResponse<{
      id: string;
      feedback: number | null;
    }>;
  } catch (error) {
    console.error("Error sending assistant feedback:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
