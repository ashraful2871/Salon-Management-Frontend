"use server";

import type { ApiResponse } from "@/lib/api-types";
import { serverFetch } from "@/lib/server-fetch";
import { getSessionUser } from "@/services/auth/session";

/**
 * `PATCH /users/:id` with only `phone`, for the signed-in user. A home visit
 * is refused with `PHONE_REQUIRED` until the profile has a mobile number, so
 * the booking form saves the one it was given.
 */
export const updateMyPhone = async (phone: string): Promise<ApiResponse<unknown>> => {
  try {
    const user = await getSessionUser();
    if (!user?.userId) return { success: false, message: "Please sign in again." };
    const response = await serverFetch.patch(`/users/${encodeURIComponent(user.userId)}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<unknown>;
  } catch (error) {
    console.error("updateMyPhone error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't save your mobile number. Please try again.",
    };
  }
};
