"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantTopupResult } from "@/lib/assistant-types";
import type { ProviderId } from "@/lib/payment-providers";
import {
  CHAT_RESUME_COOKIE,
  CHAT_RESUME_COOKIE_OPTIONS,
  assistantErrorMessage,
  assistantHeaders,
  normalizeTurn,
} from "@/lib/assistant-request";
import { setCookie } from "@/services/auth/cookiesHandler";

/**
 * Opens a wallet top-up from the chat and returns the gateway URL. The API
 * runs the wallet's own `initiateTopup`, so this is a doorway to the existing
 * payment, not a second one.
 *
 * `amountMinor` is poisha, straight from the prompt — the wallet page's
 * `initiateTopup` takes taka, this does not. A 409 still carries a turn (the
 * time was lost, here is what is free), so callers draw it rather than an
 * error.
 */
export const startAssistantTopup = async (
  conversationId: string,
  amountMinor: number,
  autoConfirm: boolean,
  label?: string,
  /** Absent: the API's default gateway (SSLCommerz). */
  provider?: ProviderId,
): Promise<ApiResponse<AssistantTopupResult>> => {
  try {
    const response = await serverFetch.post("/assistant/payments/topup", {
      headers: await assistantHeaders(),
      body: JSON.stringify({
        conversationId,
        amountMinor,
        autoConfirm,
        ...(label ? { label } : {}),
        ...(provider ? { provider } : {}),
      }),
      cache: "no-store",
    });

    const result = (await response.json()) as ApiResponse<AssistantTopupResult>;
    if (!result.data) return result;

    if (result.success && result.data.redirectUrl) {
      // Set before the browser leaves for the gateway, so the wallet result
      // page it comes back to can offer the way into this chat.
      await setCookie(
        CHAT_RESUME_COOKIE,
        conversationId,
        CHAT_RESUME_COOKIE_OPTIONS,
      );
    }

    return {
      ...result,
      data: {
        ...result.data,
        ...normalizeTurn(result.data, conversationId),
        anonymousId: null,
      },
    };
  } catch (error) {
    console.error("Error starting assistant top-up:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
