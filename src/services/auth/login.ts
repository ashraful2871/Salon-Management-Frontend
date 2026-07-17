import { parse } from "cookie";
import { setCookie } from "./cookiesHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getDefaultDashboardRoute, UserRole } from "./auth-utils";
import { redirect } from "next/navigation";
import type { ApiResponse } from "@/lib/api-types";

export const loginUser = async (
  _currentState: ApiResponse<{ message: string }> | null,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const redirectTo = formData.get("redirect");
    let accessTokenObject: Record<string, string | undefined> | null = null;
    let refreshTokenObject: Record<string, string | undefined> | null = null;

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
    const setCookieHeaders = res.headers.getSetCookie();

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        const parsedCookie = parse(cookie);
        if (parsedCookie["accessToken"]) {
          accessTokenObject = parsedCookie;
        }
        if (parsedCookie["refreshToken"]) {
          refreshTokenObject = parsedCookie;
        }
      }
    } else {
      throw new Error("No Set-Cookie headers found");
    }

    if (!accessTokenObject) {
      throw new Error("Access token cookie not found");
    }
    if (!refreshTokenObject) {
      throw new Error("Refresh token cookie not found");
    }

    await setCookie("accessToken", accessTokenObject.accessToken ?? "", {
      secure: true,
      httpOnly: true,
      maxAge: parseInt(accessTokenObject[" Max-Age"] ?? "") || 7 * 24 * 60 * 60,
      path: accessTokenObject.Path || "/",
      sameSite: (accessTokenObject.SameSite as "none") || "none",
    });

    await setCookie("refreshToken", refreshTokenObject.refreshToken ?? "", {
      secure: true,
      httpOnly: true,
      maxAge: parseInt(refreshTokenObject[" Max-Age"] ?? "") || 90 * 24 * 60 * 60,
      path: refreshTokenObject.Path || "/",
      sameSite: (refreshTokenObject.SameSite as "none") || "none",
    });

    const verifyToken = jwt.verify(
      accessTokenObject.accessToken!,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    const userRole: UserRole = verifyToken.role;

    if (!result.success) {
      throw new Error(result.message || "Login failed");
    }

    if (redirectTo) {
      // Redirect logic can be re-enabled with proper role validation
    } else {
      redirect(`${getDefaultDashboardRoute(userRole)}?loggedIn=true`);
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
