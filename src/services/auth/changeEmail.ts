"use server";

/**
 * A server action for the same reason as `changePassword`: `serverFetch` needs
 * the httpOnly `accessToken` cookie, which only exists on the server side.
 *
 * The session is replaced as well as the email. The navbar and every server
 * component read the address out of the access token, not from the API, so
 * leaving the old cookies in place would keep showing the old address until
 * the next refresh.
 */
import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { setCookie } from "./cookiesHandler";

type ChangeEmailResult = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
};

export const changeEmail = async (
  newEmail: string,
  password: string,
): Promise<ApiResponse<{ email: string }>> => {
  try {
    const response = await serverFetch.post("/auth/change-email", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, password }),
    });

    const result: ApiResponse<ChangeEmailResult> = await response.json();

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to change email.",
      };
    }

    // The API's own Set-Cookie does not stick on this domain, so the new pair
    // is written here with the same options login uses.
    await setCookie(ACCESS_TOKEN_COOKIE, result.data.accessToken, accessCookieOptions);
    await setCookie(REFRESH_TOKEN_COOKIE, result.data.refreshToken, refreshCookieOptions);

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
      data: { email: result.data.user.email },
    };
  } catch (error) {
    console.error("changeEmail error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to change email.",
    };
  }
};
