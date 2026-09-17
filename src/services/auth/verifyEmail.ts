"use server";

import type { ApiResponse } from "@/lib/api-types";

export const verifyEmail = async (token: string): Promise<ApiResponse<null>> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      },
    );

    const result: ApiResponse<null> = await res.json();

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ||
          "This verification link is invalid or has expired. Please request a new one.",
      };
    }

    return {
      success: true,
      message: result.message || "Email verified successfully.",
    };
  } catch (error) {
    console.error("verifyEmail error:", error);
    return {
      success: false,
      message: "Could not verify your email. Please try again.",
    };
  }
};

export const resendVerification = async (
  email: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const result: ApiResponse<null> = await res.json();
    return result;
  } catch (error) {
    console.error("resendVerification error:", error);
    return {
      success: false,
      message: "Could not resend the verification email. Please try again.",
    };
  }
};
