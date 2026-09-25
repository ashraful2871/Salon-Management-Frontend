"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import {
  assistantErrorMessage,
  assistantHeaders,
  CHAT_COOKIE,
  CHAT_RESUME_COOKIE,
} from "@/lib/assistant-request";
import { deleteCookie } from "@/services/auth/cookiesHandler";

/**
 * "Delete my chats". Signed-in only — the API answers 401 to a guest. The
 * guest key goes along, so a chat this device started before signing in is
 * deleted with the rest; afterwards that key and the resume pointer lead
 * nowhere, so they are forgotten too.
 */
export const deleteAssistantChats = async (): Promise<
  ApiResponse<{ deleted: number }>
> => {
  try {
    const response = await serverFetch.delete("/assistant/conversations", {
      headers: await assistantHeaders(),
      cache: "no-store",
    });

    const result = (await response.json()) as ApiResponse<{ deleted: number }>;

    if (result.success) {
      await deleteCookie(CHAT_COOKIE);
      await deleteCookie(CHAT_RESUME_COOKIE);
    }

    return result;
  } catch (error) {
    console.error("Error deleting assistant chats:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
