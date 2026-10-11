// Server-only: the pending second-factor step of an ADMIN/AGENT sign-in,
// between "the password (or Google) was right" and "the authenticator code
// was right". Like `sm_verify`, the ticket stays in an httpOnly cookie: never
// in the URL, never in client JS. It lives five minutes, as the ticket does.

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import type { TwoFactorRequired } from "./auth-types";
import { safeInAppPath } from "./safe-path";

export const TWO_FACTOR_COOKIE = "sm_2fa";

const TWO_FACTOR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 300,
} as const;

/** `t` ticket, `n` where to go afterwards (an in-app path or null). */
export type TwoFactorState = { t: string; n: string | null };

const encode = (state: TwoFactorState): string =>
  Buffer.from(JSON.stringify(state), "utf8").toString("base64url");

const decode = (raw: string): TwoFactorState | null => {
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!v || typeof v.t !== "string" || !v.t) return null;
    return { t: v.t, n: safeInAppPath(v.n) };
  } catch {
    return null;
  }
};

const valueFor = (tf: TwoFactorRequired, next: unknown) =>
  encode({ t: tf.ticket, n: safeInAppPath(next) });

export const setTwoFactorCookie = async (
  tf: TwoFactorRequired,
  next: unknown,
): Promise<void> => {
  (await cookies()).set(TWO_FACTOR_COOKIE, valueFor(tf, next), TWO_FACTOR_COOKIE_OPTIONS);
};

/** For the Google callback route handler, which writes on its response. */
export const setTwoFactorCookieOnResponse = (
  res: NextResponse,
  tf: TwoFactorRequired,
  next: unknown,
): void => {
  res.cookies.set(TWO_FACTOR_COOKIE, valueFor(tf, next), TWO_FACTOR_COOKIE_OPTIONS);
};

export const readTwoFactorCookie = async (): Promise<TwoFactorState | null> => {
  const raw = (await cookies()).get(TWO_FACTOR_COOKIE)?.value;
  return raw ? decode(raw) : null;
};

export const clearTwoFactorCookie = async (): Promise<void> => {
  (await cookies()).delete({ name: TWO_FACTOR_COOKIE, path: "/" });
};
