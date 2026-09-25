import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { decodeJwt, isTokenExpiring } from "@/lib/jwt";
import {
  PATHNAME_HEADER,
  ROLE_HOME,
  canAccessRoute,
  deniedUrl,
  isGuestOnlyRoute,
  isPrivateRoute,
  isSignedInRole,
  loginUrl,
} from "@/lib/route-access";
import { refreshSession } from "@/services/auth/refreshSession";
import type { UserRole } from "@/services/auth/auth-utils";

const RENEW_BEFORE_MS = 5 * 60 * 1000;

/**
 * Two jobs, in this order: keep the session alive, then decide where the
 * request is allowed to go.
 *
 * The order matters. A token that expired while the tab sat idle would
 * otherwise read as "not signed in" and bounce the user to the login page they
 * do not need - renewing first means the gate judges the session the user
 * actually has.
 *
 * What this is *not* is the authorization boundary. The role read here comes
 * out of an unverified token (the Edge runtime has no `jsonwebtoken`), so it is
 * a routing hint: it saves an unauthorised request the cost of a render and
 * gives the user an instant redirect instead of a flash of a page they cannot
 * use. The decision is made again, on a verified session, by the guards in
 * `src/lib/auth-guard.ts`, and a third time by the backend's `auth(...roles)`
 * middleware, which is the only one an attacker cannot skip.
 */

type Renewal =
  | { kind: "kept"; accessToken: string | null }
  | { kind: "renewed"; accessToken: string; refreshToken: string }
  | { kind: "ended" };

const renewIfNeeded = async (request: NextRequest): Promise<Renewal> => {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;

  if (!refreshToken) return { kind: "kept", accessToken };

  if (accessToken && !isTokenExpiring(accessToken, RENEW_BEFORE_MS)) {
    return { kind: "kept", accessToken };
  }

  const outcome = await refreshSession(refreshToken);

  if (outcome.status === "refreshed") {
    return {
      kind: "renewed",
      accessToken: outcome.session.accessToken,
      refreshToken: outcome.session.refreshToken,
    };
  }

  // Only a refusal ends the session. An unreachable API leaves the cookies
  // alone - and the stale token in place - so the next request can try again
  // rather than signing the user out over a blip.
  if (outcome.status === "rejected") return { kind: "ended" };

  return { kind: "kept", accessToken };
};

/** The role claimed by a token, without verifying it. See the note above. */
const claimedRole = (accessToken: string | null): UserRole | undefined => {
  if (!accessToken) return undefined;

  const role = decodeJwt(accessToken)?.role;

  return isSignedInRole(role as UserRole) ? (role as UserRole) : undefined;
};

/**
 * Where to send the user back to after signing in.
 *
 * A client-side navigation asks for the RSC payload of the page, not the page,
 * and carries a `_rsc` cache-buster to prove it. Echoing that back would return
 * the user to a URL that renders as a payload dump, so it is dropped.
 */
const returnTarget = (url: NextRequest["nextUrl"]): string => {
  const query = new URLSearchParams(url.search);
  query.delete("_rsc");

  const rest = query.toString();

  return rest ? `${url.pathname}?${rest}` : url.pathname;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const renewal = await renewIfNeeded(request);
  const accessToken = renewal.kind === "ended" ? null : renewal.accessToken;
  const role = claimedRole(accessToken);

  // Forwarded so a guard can build an accurate "come back here after signing
  // in" link. Set, never appended, so a client-supplied header cannot survive.
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, pathname);

  if (renewal.kind === "renewed") {
    request.cookies.set(ACCESS_TOKEN_COOKIE, renewal.accessToken);
    request.cookies.set(REFRESH_TOKEN_COOKIE, renewal.refreshToken);
  }

  // Only *navigations* are gated. A Server Action posts to whatever URL the
  // user happens to be on, so the path says nothing about where they are
  // going - and the action may be the very thing creating the session. Turning
  // one away mid-flight silently cancels it: this gate used to bounce the
  // second of the two `setCookie` calls in `loginUser`, because the first had
  // already planted the access token, which left every login without a refresh
  // token and swallowed its redirect. Actions answer to the guards in
  // `auth-guard.ts` and to the backend instead.
  const isNavigation = request.method === "GET";

  const redirectTo = (() => {
    if (!isNavigation) return null;

    if (isPrivateRoute(pathname)) {
      if (!role) return loginUrl(returnTarget(request.nextUrl));
      if (!canAccessRoute(role, pathname)) return deniedUrl(role);
      return null;
    }

    // Nobody needs a login form while holding a session.
    if (role && isGuestOnlyRoute(pathname)) return ROLE_HOME[role];

    return null;
  })();

  const response = redirectTo
    ? NextResponse.redirect(new URL(redirectTo, request.url))
    : NextResponse.next({ request: { headers } });

  if (renewal.kind === "renewed") {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      renewal.accessToken,
      accessCookieOptions,
    );
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      renewal.refreshToken,
      refreshCookieOptions,
    );
  }

  if (renewal.kind === "ended") {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth/refresh|api/auth/google|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|txt|xml|woff2?)$).*)",
  ],
};
