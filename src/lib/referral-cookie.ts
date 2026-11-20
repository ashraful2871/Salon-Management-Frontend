// Server-only: writes cookies.

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { REF_COOKIE } from "@/lib/referral";

/** Must match the `path` `/r/[code]` sets it with, or the delete misses it. */
const REF_COOKIE_PATH = "/";

/**
 * Drops the invite-link cookie (`sm_ref`) once an account exists, so a later
 * sign-up on this device doesn't inherit the code. For server actions
 * (register, verify-otp), next to the auth cookies they set.
 */
export const clearRefCookie = async (): Promise<void> => {
  const store = await cookies();
  if (store.has(REF_COOKIE)) store.delete({ name: REF_COOKIE, path: REF_COOKIE_PATH });
};

/** `clearRefCookie` for a route handler (the Google callback). */
export const clearRefCookieOnResponse = (req: NextRequest, res: NextResponse): void => {
  if (req.cookies.has(REF_COOKIE)) res.cookies.delete({ name: REF_COOKIE, path: REF_COOKIE_PATH });
};
