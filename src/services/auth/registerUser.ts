/* eslint-disable @typescript-eslint/no-explicit-any */
import { setCookie } from "./cookiesHandler";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";

/**
 * Registers the user and signs them in in the same step — the backend returns
 * the same token pair as /auth/login, so there is no reason to bounce them to
 * the login screen and make them retype what they just typed.
 */
export const registerUser = async (
  _currentState: unknown,
  formData: FormData,
): Promise<any> => {
  let payload;
  try {
    const role = formData.get("isSalonOwner") ? "SALON_OWNER" : "CUSTOMER";

    payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      phoneNumber: formData.get("phoneNumber"),
      gender: formData.get("gender"),
      ...(role === "SALON_OWNER" && { role }),
    };

    if (payload.password !== payload.confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match.",
        inputs: payload,
      };
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result = await res.json();

    if (!result.success) {
      return { ...result, inputs: payload };
    }

    // Same extraction as login: prefer the Set-Cookie headers, fall back to the
    // response body for deployments where the cookie is dropped cross-origin.
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

    // The account exists either way — send them to sign in rather than
    // reporting a failure for something that actually succeeded.
    if (!accessToken || !refreshToken) {
      redirect("/login?registered=true");
    }

    await setCookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);
    await setCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);

    redirect("/?registered=true");
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("registerUser error:", error);
    return {
      success: false,
      message: "Registration failed. Please try again.",
      inputs: payload,
    };
  }
};
