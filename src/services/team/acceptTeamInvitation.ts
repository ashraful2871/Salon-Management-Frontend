"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { BRANCH_COOKIE, BRANCH_COOKIE_OPTIONS } from "@/lib/branch-cookie-name";

type Accepted = {
  salonId: string;
  accessToken?: string;
  refreshToken?: string;
};

/**
 * `POST /invitations/accept`. The API re-derives the account role and bumps
 * sessionVersion - which ends this session, so a refresh would be refused -
 * and answers with a fresh token pair carrying the new role. The pair is
 * written on this domain (the API's own Set-Cookie would not stick here), the
 * new branch becomes the selected one, and the member lands on `/dashboard`.
 */
export const acceptTeamInvitation = async (
  _prev: ApiResponse | null,
  formData: FormData,
): Promise<ApiResponse> => {
  const token = String(formData.get("token") ?? "");
  let accepted: Accepted | undefined;

  try {
    const response = await serverFetch.post("/invitations/accept", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<Accepted>;
    if (!result.success) return result;
    accepted = result.data;
  } catch (error) {
    console.error("acceptTeamInvitation error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't accept the invitation. Please try again.",
    };
  }

  const store = await cookies();
  if (accepted?.accessToken && accepted.refreshToken) {
    store.set(ACCESS_TOKEN_COOKIE, accepted.accessToken, accessCookieOptions);
    store.set(REFRESH_TOKEN_COOKIE, accepted.refreshToken, refreshCookieOptions);
    // Written directly: `setSelectedBranch` would check the id against
    // `/owner/access` with this request's old, now refused, token.
    store.set(BRANCH_COOKIE, accepted.salonId, BRANCH_COOKIE_OPTIONS);
    revalidateTag(TAGS.ownerAccess, "max");
    redirect("/dashboard");
  }

  // No fresh pair (an older API): the old session is over, so sign in again.
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  redirect("/login?redirect=%2Fdashboard");
};
