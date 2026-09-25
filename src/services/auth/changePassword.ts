"use server";

/**
 * A server action, not a plain helper. Its only caller is a client component,
 * and `serverFetch` authenticates by attaching the httpOnly `accessToken`
 * cookie as a `Cookie` header - something the browser silently strips from any
 * fetch it makes itself, so run from the client this reached the API as an
 * anonymous request. The directive moves the call back to the server, where the
 * cookie and the token renewal that goes with it actually exist.
 *
 * The API ends every session on a password change and hands this one a fresh
 * pair, which is written here so this device stays signed in.
 */
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { applySession, extractTokens } from "@/lib/auth-session";

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.post("/auth/change-password", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const result: ApiResponse<unknown> = await response.json();

    if (!result.success) {
      return { success: false, message: result.message };
    }

    const tokens = extractTokens(response, result);
    if (tokens) await applySession(tokens);

    return {
      success: true,
      message: "Password changed. Other devices have been signed out.",
      data: null,
    };
  } catch (error) {
    console.error("changePassword error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to change password.",
    };
  }
};
