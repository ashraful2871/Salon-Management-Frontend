import { setCookie } from "./cookiesHandler";
import type { UserRole } from "./auth-utils";
import { redirect } from "next/navigation";
import type { ApiResponse } from "@/lib/api-types";

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

    await setCookie("accessToken", accessToken, {
      secure: true,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    await setCookie("refreshToken", refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

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
