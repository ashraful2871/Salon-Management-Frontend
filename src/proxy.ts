import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { isTokenExpiring } from "@/lib/jwt";
import { refreshSession } from "@/services/auth/refreshSession";

/**
 * Keeps the signed-in session alive across navigations.
 *
 * This is the only place in the app that can *durably* replace the session
 * cookies during an ordinary page load. React server components render
 * read-only - `cookies().set()` throws inside them - so without this the
 * session helper could renew a token for the request it was serving and then
 * lose it, refreshing again on the very next page. Here the new pair goes out
 * in `Set-Cookie` and is also written back onto the incoming request, so the
 * render that follows sees the fresh token rather than the one that just died.
 *
 * Runs before every page and server action (see `config.matcher`), which is why
 * it has to stay cheap: with a healthy token it reads one cookie, decodes the
 * `exp` claim and returns.
 *
 * Deliberately not an auth gate. Route protection is the backend's `auth()`
 * middleware; the only thing decided here is whether to renew a token.
 */

/**
 * Renew this long before the token actually expires.
 *
 * Five minutes covers the gap between this check and the API calls the page
 * will make a moment later, and absorbs a few minutes of clock drift between
 * the Edge runtime and the API host - a token that is thirty seconds from
 * expiry by our clock may already be rejected by theirs.
 */
const RENEW_BEFORE_MS = 5 * 60 * 1000;

export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // No refresh token: a visitor, or someone whose session has already been
  // cleaned up. Nothing to renew.
  if (!refreshToken) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken && !isTokenExpiring(accessToken, RENEW_BEFORE_MS)) {
    return NextResponse.next();
  }

  const outcome = await refreshSession(refreshToken);

  if (outcome.status === "rejected") {
    // The API says this session is genuinely over - the refresh token has
    // expired or the account is no longer active. Drop both cookies so the page
    // renders as a visitor instead of retrying on every single navigation.
    const response = NextResponse.next();
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  if (outcome.status === "unavailable") {
    // Could not reach the API - a deploy, or a cold Render instance. Keep the
    // cookies and let the next request try again; signing the user out over a
    // blip is exactly the behaviour this whole flow exists to prevent.
    return NextResponse.next();
  }

  const { session } = outcome;

  // Rewriting the request's own cookies is what lets the components rendering
  // *this* request use the new token, rather than having to wait for the
  // browser to send it back on the next one.
  request.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    accessCookieOptions,
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    refreshCookieOptions,
  );

  return response;
}

export const config = {
  /**
   * Everything except static assets and the keep-alive route, which does its
   * own renewal and would otherwise have this run first and make its work
   * pointless.
   */
  matcher: [
    "/((?!api/auth/refresh|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|txt|xml|woff2?)$).*)",
  ],
};
