// Server-only: the pending email verification between "a code was sent" and
// "the code was accepted". The ticket is the whole of the claim to that
// verification, so it stays in an httpOnly cookie: never in the URL, never in
// client JS. The code screen gets only the masked email and the two deadlines.

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import type { VerificationRequired } from "./auth-types";
import { safeInAppPath } from "./safe-path";

export const VERIFY_COOKIE = "sm_verify";

export const VERIFY_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 1800,
} as const;

const KINDS = ["register", "login", "google"] as const;
export type VerifyKind = (typeof KINDS)[number];

/** Short keys keep the cookie small. `x` / `r` are epoch milliseconds. */
export type VerifyState = {
  /** ticket */
  t: string;
  /** masked email */
  e: string;
  /** where to go after the code, an in-app path or null */
  n: string | null;
  /** which flow started it */
  k: VerifyKind;
  /** code expires at */
  x: number;
  /** resend allowed at */
  r: number;
};

/** Only ever an in-app path: an absolute or protocol-relative URL here would
 *  make the code screen an open redirect. */
const safeNext = safeInAppPath;

const encode = (state: VerifyState): string =>
  Buffer.from(JSON.stringify(state), "utf8").toString("base64url");

const decode = (raw: string): VerifyState | null => {
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      !v ||
      typeof v !== "object" ||
      typeof v.t !== "string" ||
      !v.t ||
      typeof v.e !== "string" ||
      !KINDS.includes(v.k) ||
      !Number.isFinite(v.x) ||
      !Number.isFinite(v.r)
    ) {
      return null;
    }
    return { t: v.t, e: v.e, n: safeNext(v.n), k: v.k, x: v.x, r: v.r };
  } catch {
    return null;
  }
};

/**
 * The cookie value for a fresh verification. Exported for route handlers that
 * set it on their own `NextResponse` (with `VERIFY_COOKIE_OPTIONS`); server
 * actions use `setVerifyCookie`.
 */
export const encodeVerify = (
  vr: VerificationRequired,
  next: unknown,
  kind: VerifyKind,
): string => {
  const now = Date.now();
  return encode({
    t: vr.ticket,
    e: vr.maskedEmail,
    n: safeNext(next),
    k: kind,
    x: now + vr.expiresIn * 1000,
    r: now + vr.resendIn * 1000,
  });
};

const write = async (value: string): Promise<void> => {
  const store = await cookies();
  store.set(VERIFY_COOKIE, value, VERIFY_COOKIE_OPTIONS);
};

export const setVerifyCookie = async (
  vr: VerificationRequired,
  next: unknown,
  kind: VerifyKind,
): Promise<void> => {
  await write(encodeVerify(vr, next, kind));
};

/** `setVerifyCookie` for a route handler, which writes on the response it
 *  returns rather than through `cookies()`. */
export const setVerifyCookieOnResponse = (
  res: NextResponse,
  vr: VerificationRequired,
  next: unknown,
  kind: VerifyKind,
): void => {
  res.cookies.set(VERIFY_COOKIE, encodeVerify(vr, next, kind), VERIFY_COOKIE_OPTIONS);
};

/** Null on a missing or malformed cookie; callers treat both as "nothing to
 *  verify". */
export const readVerifyCookie = async (): Promise<VerifyState | null> => {
  const raw = (await cookies()).get(VERIFY_COOKIE)?.value;
  return raw ? decode(raw) : null;
};

/** After a resend: the new code has a new expiry and a new resend wait. */
export const updateVerifyTimings = async (
  expiresIn: number,
  resendIn: number,
): Promise<VerifyState | null> => {
  const state = await readVerifyCookie();
  if (!state) return null;

  const now = Date.now();
  const updated = {
    ...state,
    x: now + expiresIn * 1000,
    r: now + resendIn * 1000,
  };
  await write(encode(updated));
  return updated;
};

export const clearVerifyCookie = async (): Promise<void> => {
  (await cookies()).delete({ name: VERIFY_COOKIE, path: "/" });
};
