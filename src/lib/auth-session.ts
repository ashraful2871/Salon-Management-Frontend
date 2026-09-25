// Server-only: writes cookies. Shared by login, register, verify-otp and the
// Google callback, the calls that can come back with a token pair.

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "./auth-cookies";

export type SessionTokens = { accessToken: string; refreshToken: string };

type TokenBody = { data?: unknown } | null;

/**
 * Prefer the API's Set-Cookie headers, fall back to the response body for
 * deployments where the cookie is dropped cross-origin. Null when either token
 * is missing.
 */
export const extractTokens = (
  res: Response,
  body: TokenBody,
): SessionTokens | null => {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;

  for (const cookie of res.headers.getSetCookie()) {
    const [name, ...rest] = cookie.split(";")[0].split("=");
    const value = rest.join("=");
    if (name?.trim() === ACCESS_TOKEN_COOKIE) accessToken = value;
    if (name?.trim() === REFRESH_TOKEN_COOKIE) refreshToken = value;
  }

  const data = body?.data as
    | { accessToken?: unknown; refreshToken?: unknown }
    | null
    | undefined;
  if (!accessToken && typeof data?.accessToken === "string") {
    accessToken = data.accessToken;
  }
  if (!refreshToken && typeof data?.refreshToken === "string") {
    refreshToken = data.refreshToken;
  }

  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
};

/**
 * Re-set both tokens on this domain. Options come from the shared module so
 * that login, the proxy and the keep-alive route all write the same cookie; a
 * cookie rewritten with a different `path` or `sameSite` is a second cookie as
 * far as the browser is concerned.
 */
export const applySession = async (tokens: SessionTokens): Promise<void> => {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions);
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);
};

/** `applySession` for a route handler (the Google callback), which writes on
 *  the response it returns rather than through `cookies()`. */
export const applySessionOnResponse = (
  res: NextResponse,
  tokens: SessionTokens,
): void => {
  res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions);
  res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);
};
