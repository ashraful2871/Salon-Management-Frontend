"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiResponse } from "@/lib/api-types";
import {
  ACCESS_TOKEN_COOKIE,
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  REFRESH_TOKEN_COOKIE,
  impersonationCookieOptions,
} from "@/lib/auth-cookies";
import { impersonationOf } from "@/lib/jwt";
import { adminSend } from "../request";

type ViewAs = { accessToken: string; until: number; user: { id: string; name: string; role: string } };

/**
 * `POST /admin/impersonate/:userId` (tier 3: step-up). On success the admin's
 * own pair moves to `sm_admin_access`/`sm_admin_refresh`, `accessToken` becomes
 * the read-only view-as token, there is no refresh token, and the browser goes
 * to the user's dashboard. Only failures return.
 */
export const startImpersonation = async (userId: string, reason: string): Promise<ApiResponse<never>> => {
  const store = await cookies();
  if (impersonationOf(store.get(ACCESS_TOKEN_COOKIE)?.value)) {
    return { success: false, message: "End the current view first." };
  }

  const result = await adminSend<ViewAs>(
    "post",
    `/admin/impersonate/${encodeURIComponent(userId)}`,
    { reason },
    "Couldn't start the view. Please try again.",
  );
  if (!result.success || !result.data?.accessToken) {
    return { success: false, message: result.message, errorCode: result.errorCode };
  }

  // Read after the call: serverFetch may have renewed the admin's pair.
  const adminAccess = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const adminRefresh = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const options = impersonationCookieOptions(result.data.until);

  if (adminAccess) store.set(ADMIN_ACCESS_COOKIE, adminAccess, options);
  if (adminRefresh) store.set(ADMIN_REFRESH_COOKIE, adminRefresh, options);
  store.set(ACCESS_TOKEN_COOKIE, result.data.accessToken, options);
  // No refresh: the proxy and serverFetch then have nothing to renew it with.
  store.delete(REFRESH_TOKEN_COOKIE);

  redirect("/dashboard");
};
