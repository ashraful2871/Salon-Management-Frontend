"use server";

import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { deleteCookie } from "@/services/auth/cookiesHandler";

/**
 * `POST /invitations/admin/accept`. The API makes the account an admin or
 * agent and ends its sessions (sessionVersion bump), so on success the
 * cookies go too and the person signs in again, landing on the 2FA setup.
 */
export const acceptInvitation = async (
  _prev: ApiResponse | null,
  formData: FormData,
): Promise<ApiResponse> => {
  const token = String(formData.get("token") ?? "");
  let accepted = false;

  try {
    const response = await serverFetch.post("/invitations/admin/accept", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse;
    if (!result.success) return result;
    accepted = true;
  } catch (error) {
    console.error("acceptInvitation error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't accept the invitation. Please try again.",
    };
  }

  if (accepted) {
    await deleteCookie(REFRESH_TOKEN_COOKIE);
    await deleteCookie(ACCESS_TOKEN_COOKIE);
  }
  redirect("/login?redirect=%2Fdashboard%2Fadmin%2Fsecurity");
};
