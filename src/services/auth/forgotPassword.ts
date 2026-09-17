"use server";

import type { ApiResponse } from "@/lib/api-types";

const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

/**
 * The backend answers 200 whether or not the address is registered, so the UI
 * shows the same confirmation either way — never "no such user".
 */
export const forgotPassword = async (
  _currentState: ApiResponse<null> | null,
  formData: FormData,
): Promise<ApiResponse<null>> => {
  try {
    const email = formData.get("email");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const result: ApiResponse<null> = await res.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Could not send the reset link.",
      };
    }

    return { success: true, message: result.message || GENERIC_MESSAGE };
  } catch (error) {
    console.error("forgotPassword error:", error);
    return {
      success: false,
      message: "Could not send the reset link. Please try again.",
    };
  }
};
