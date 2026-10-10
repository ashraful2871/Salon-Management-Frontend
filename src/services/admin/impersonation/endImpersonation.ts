"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { decodeJwt, impersonationOf, isTokenExpiring } from "@/lib/jwt";
import { serverFetch } from "@/lib/server-fetch";
import { refreshSession } from "@/services/auth/refreshSession";

/**
 * Ends a "View as": puts the admin's own pair back, records
 * `impersonation.end` with the admin's token, and returns to the user's 360.
 * Called by the banner's End button and when its countdown reaches zero.
 */
export const endImpersonation = async (): Promise<void> => {
  const store = await cookies();
  const viewToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  let adminAccess = store.get(ADMIN_ACCESS_COOKIE)?.value;
  let adminRefresh = store.get(ADMIN_REFRESH_COOKIE)?.value;
  store.delete(ADMIN_ACCESS_COOKIE);
  store.delete(ADMIN_REFRESH_COOKIE);

  if (!impersonationOf(viewToken)) redirect("/dashboard");
  const targetId = decodeJwt(viewToken!)?.userId;

  if (!adminAccess) {
    // The stash is gone (the view outlived it): sign in again.
    store.delete(ACCESS_TOKEN_COOKIE);
    store.delete(REFRESH_TOKEN_COOKIE);
    redirect("/login");
  }

  if (isTokenExpiring(adminAccess) && adminRefresh) {
    const outcome = await refreshSession(adminRefresh);
    if (outcome.status === "refreshed") {
      adminAccess = outcome.session.accessToken;
      adminRefresh = outcome.session.refreshToken;
    }
  }

  store.set(ACCESS_TOKEN_COOKIE, adminAccess, accessCookieOptions);
  if (adminRefresh) store.set(REFRESH_TOKEN_COOKIE, adminRefresh, refreshCookieOptions);
  else store.delete(REFRESH_TOKEN_COOKIE);

  try {
    // The admin's token, explicitly: the cookie store may still hold the view.
    await serverFetch.post("/admin/impersonate/end", {
      headers: { "Content-Type": "application/json", Cookie: `accessToken=${adminAccess}` },
      body: JSON.stringify({ token: viewToken }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("POST /admin/impersonate/end error:", error);
  }

  redirect(typeof targetId === "string" ? `/dashboard/admin/users/${encodeURIComponent(targetId)}` : "/dashboard/admin/users");
};
