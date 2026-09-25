"use server";

/**
 * Server actions for the same reason as `changePassword`: `serverFetch` needs
 * the httpOnly `accessToken` cookie, which only exists on the server side.
 *
 * Two steps. `requestEmailChange` sends a code to the new address and changes
 * nothing; `confirmEmailChange` trades the code for the switch. The session is
 * replaced on confirm: the navbar and every server component read the address
 * out of the access token, and the API has just signed out every other session.
 */
import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { applySession, extractTokens } from "@/lib/auth-session";

export type EmailChangeCode = {
  maskedEmail: string;
  expiresIn: number;
  resendIn: number;
};

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message:
    process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

export const requestEmailChange = async (
  newEmail: string,
  password?: string,
): Promise<ApiResponse<EmailChangeCode>> => {
  try {
    const response = await serverFetch.post("/auth/change-email", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(password ? { newEmail, password } : { newEmail }),
    });

    return (await response.json()) as ApiResponse<EmailChangeCode>;
  } catch (error) {
    console.error("requestEmailChange error:", error);
    return failure(error, "Failed to send the code.");
  }
};

export const confirmEmailChange = async (
  code: string,
): Promise<ApiResponse<{ email: string }>> => {
  try {
    const response = await serverFetch.post("/auth/change-email/confirm", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const result: ApiResponse<{ user?: { email: string } }> = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Failed to change email.",
        errorCode: result.errorCode,
        details: result.details,
      };
    }

    // The API's own Set-Cookie does not stick on this domain, so the new pair
    // is written here with the same options login uses.
    const tokens = extractTokens(response, result);
    if (tokens) await applySession(tokens);

    // Lists that show a user's email next to their name.
    revalidateTag("users", "seconds");
    revalidateTag("my-customers", "seconds");
    revalidateTag("appointments", "seconds");
    revalidateTag("salons", "seconds");
    revalidateTag("salon-applications", "seconds");

    // Tokens stay on the server; the client only needs the address it now has.
    return {
      success: true,
      message: result.message,
      data: { email: result.data?.user?.email ?? "" },
    };
  } catch (error) {
    console.error("confirmEmailChange error:", error);
    return failure(error, "Failed to change email.");
  }
};
