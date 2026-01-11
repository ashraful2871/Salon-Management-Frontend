/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { parse } from "cookie";
import { setCookie } from "./cookiesHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getDefaultDashboardRoute, UserRole } from "./auth-utils";
import { redirect } from "next/navigation";
export const loginUser = async (
  _currentState: any,
  formData: any
): Promise<any> => {
  try {
    const redirectTo = formData.get("redirect");
    let accessTokenObject: null | any = null;
    let refreshTokenObject: null | any = null;

    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie: string) => {
        const parsedCookie = parse(cookie);
        if (parsedCookie["accessToken"]) {
          accessTokenObject = parsedCookie;
        }
        if (parsedCookie["refreshToken"]) {
          refreshTokenObject = parsedCookie;
        }
      });
    } else {
      throw new Error("No Set-Cookie headers found");
    }
    if (!accessTokenObject) {
      throw new Error("Access token cookie not found");
    }
    if (!refreshTokenObject) {
      throw new Error("Refresh token cookie not found");
    }

    await setCookie("accessToken", accessTokenObject.accessToken, {
      secure: true,
      httpOnly: true,
      maxAge:
        parseInt(accessTokenObject[" Max-Age"]) || 7 * 24 * 60 * 60 * 1000, // 7 days
      path: accessTokenObject.Path || "/",
      sameSite: accessTokenObject.SameSite || "none",
    });

    await setCookie("refreshToken", refreshTokenObject.refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge:
        parseInt(refreshTokenObject[" Max-Age"]) || 90 * 24 * 60 * 60 * 1000, // 90 days
      path: refreshTokenObject.Path || "/",
      sameSite: refreshTokenObject.SameSite || "none",
    });

    const verifyToken: JwtPayload | string = jwt.verify(
      accessTokenObject.accessToken,
      process.env.JWT_SECRET as string
    );

    if (typeof verifyToken === "string") {
      throw new Error("Invalid token");
    }

    if (typeof verifyToken === "string") {
      throw new Error("Invalid token");
    }

    const userRole: UserRole = verifyToken.role;

    if (!result.success) {
      throw new Error(result.message || "Login failed");
    }
    if (!result.success) {
      throw new Error(result.message || "Login failed");
    }

    if (redirectTo) {
      // const requestedPath = redirectTo.toString();
      // if (isValidRedirectForRole(requestedPath, userRole)) {
      //   redirect(requestedPath);
      // } else {
      //   redirect(`${getDefaultDashboardRoute(userRole)}?loggedIn=true`);
      // }
    } else {
      redirect(`${getDefaultDashboardRoute(userRole)}?loggedIn=true`);
    }
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.log(error);
    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Login Failed. You might have entered incorrect email or password."
      }`,
    };
  }
};
