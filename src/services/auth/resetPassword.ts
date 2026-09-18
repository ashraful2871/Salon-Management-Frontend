"use server";

import type { ApiResponse } from "@/lib/api-types";

export const resetPassword = async (
  _currentState: ApiResponse<null> | null,
  formData: FormData,
): Promise<ApiResponse<null>> => {
  try {
    const token = formData.get("token") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      return { success: false, message: "Passwords do not match." };
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      },
    );

    const result: ApiResponse<null> = await res.json();

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ||
          "This reset link is invalid or has expired. Please request a new one.",
      };
    }

    return {
      success: true,
      message: result.message || "Password reset successfully.",
    };
  } catch (error) {
    console.error("resetPassword error:", error);
    return {
      success: false,
      message: "Could not reset your password. Please try again.",
    };
  }
};
