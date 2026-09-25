"use server";

import { cookies } from "next/headers";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AssistantAction, AssistantTurn } from "@/lib/assistant-types";
import {
  assistantErrorMessage,
  assistantHeaders,
  CHAT_COOKIE,
  CHAT_COOKIE_OPTIONS,
  normalizeTurn,
} from "@/lib/assistant-request";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";
import { setCookie } from "@/services/auth/cookiesHandler";

/**
 * Opens a chat. The API runs an optional first action in the same request, so
 * the widget draws its first blocks in one round trip instead of two.
 *
 * With no action of its own to run, a saved `sm_loc` is sent as `set_location`:
 * a customer who already told the navbar where they are should not be asked
 * again by the chat. Without one we send `start`, which is the greeting.
 *
 * A guest gets an `anonymousId` back exactly once. It is stored here, in an
 * httpOnly cookie on this domain - a `Set-Cookie` from the API host would not
 * stick, the same reason `loginUser` re-sets the auth cookies itself.
 */
export const startConversation = async (
  action?: AssistantAction,
  label?: string,
): Promise<ApiResponse<AssistantTurn>> => {
  try {
    const saved = parseSavedLocation(
      (await cookies()).get(LOCATION_COOKIE)?.value,
    );

    const first: AssistantAction =
      action ??
      (saved
        ? {
            type: "set_location",
            lat: saved.lat,
            lng: saved.lng,
            label: saved.label,
          }
        : { type: "start" });

    const response = await serverFetch.post("/assistant/conversations", {
      headers: await assistantHeaders(),
      body: JSON.stringify({
        action: first,
        ...(label ? { label } : {}),
      }),
      // A chat turn is never a cached read.
      cache: "no-store",
    });

    const result = (await response.json()) as ApiResponse<
      AssistantTurn & { id?: string }
    >;

    if (!result.success || !result.data) return result;

    const turn = normalizeTurn(result.data, result.data.conversationId);

    if (turn.anonymousId) {
      await setCookie(CHAT_COOKIE, turn.anonymousId, CHAT_COOKIE_OPTIONS);
    }

    // The key stays on the server; the browser only ever learns the id.
    return { ...result, data: { ...turn, anonymousId: null } };
  } catch (error) {
    console.error("Error starting assistant conversation:", error);
    return { success: false, message: assistantErrorMessage(error) };
  }
};
