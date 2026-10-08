"use server";

import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { safeInAppPath } from "@/lib/safe-path";
import { deleteCookie } from "./cookiesHandler";

/**
 * "Switch account": sign out here, then sign in again and come back to
 * `returnTo` (an in-app path only). The refresh token goes first, as in
 * `logOutUser`, so the proxy cannot mint a new session in between.
 */
export const signOutTo = async (formData: FormData): Promise<void> => {
  const returnTo = safeInAppPath(formData.get("returnTo")) ?? "/";
  await deleteCookie(REFRESH_TOKEN_COOKIE);
  await deleteCookie(ACCESS_TOKEN_COOKIE);
  redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
};
