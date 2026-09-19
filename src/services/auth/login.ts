import { setCookie } from "./cookiesHandler";
import { redirect } from "next/navigation";
import type { ApiResponse } from "@/lib/api-types";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";

export const loginUser = async (
  _currentState: ApiResponse<{ message: string }> | null,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const redirectTo = formData.get("redirect");

    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || "Login failed");
    }

    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        const parts = cookie.split(";")[0];
        const [name, ...rest] = parts.split("=");
        const value = rest.join("=");
        if (name?.trim() === "accessToken") accessToken = value;
        if (name?.trim() === "refreshToken") refreshToken = value;
      }
    }

    if (!accessToken && result.data?.accessToken) {
      accessToken = result.data.accessToken;
    }
    if (!refreshToken && result.data?.refreshToken) {
      refreshToken = result.data.refreshToken;
    }

    if (!accessToken) throw new Error("Access token not found in response");
    if (!refreshToken) throw new Error("Refresh token not found in response");

    // Options come from the shared module so that login, the proxy and the
    // keep-alive route all write the same cookie. They did not before, and a
    // cookie rewritten with a different `path` or `sameSite` is a second cookie
    // as far as the browser is concerned.
    await setCookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);
    await setCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);

    if (redirectTo) {
      redirect(redirectTo as string);
    } else {
      redirect("/?loggedIn=true");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("loginUser error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Login Failed. You might have entered incorrect email or password.",
    };
  }
};
