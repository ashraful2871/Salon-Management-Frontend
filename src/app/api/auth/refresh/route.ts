import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { getTokenExpiry, isTokenExpiring } from "@/lib/jwt";
import { refreshSession } from "@/services/auth/refreshSession";

/**
 * Keep-alive endpoint for the tab that is open but not navigating.
 *
 * The proxy renews on navigation, which covers browsing. It does not cover the
 * case this whole change is about: someone part way through a booking, on one
 * page, for longer than the access token lives. `SessionKeepAlive` posts here a
 * couple of minutes before expiry and the session rolls over underneath them.
 *
 * A Route Handler is used rather than a Server Action because this is the only
 * kind of request that may *write* cookies without being tied to a form
 * submission or a re-render.
 *
 * It renews the caller's own session and nothing else - the refresh token comes
 * from their httpOnly cookie, never from the request body - so there is nothing
 * here for an unauthenticated caller to obtain.
 */

export const dynamic = "force-dynamic";

type KeepAliveResult = {
  authenticated: boolean;
  /** Epoch ms, for scheduling the next renewal. */
  expiresAt: number | null;
};

const json = (result: KeepAliveResult) =>
  NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });

export async function POST() {
  const store = await cookies();

  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return json({ authenticated: false, expiresAt: null });
  }

  // A tab woken from sleep, or one that lost a timer, can arrive here with
  // plenty of life left. Answer from the cookie rather than spending a round
  // trip, and let the client reschedule.
  if (accessToken && !isTokenExpiring(accessToken, 60_000)) {
    return json({
      authenticated: true,
      expiresAt: getTokenExpiry(accessToken),
    });
  }

  const outcome = await refreshSession(refreshToken);

  if (outcome.status === "rejected") {
    store.delete(ACCESS_TOKEN_COOKIE);
    store.delete(REFRESH_TOKEN_COOKIE);
    return json({ authenticated: false, expiresAt: null });
  }

  if (outcome.status === "unavailable") {
    // Still signed in as far as this browser is concerned. Handing back the old
    // expiry - already in the past - makes the client retry on its short floor
    // rather than give up.
    return json({
      authenticated: true,
      expiresAt: accessToken ? getTokenExpiry(accessToken) : null,
    });
  }

  const { session } = outcome;

  store.set(ACCESS_TOKEN_COOKIE, session.accessToken, accessCookieOptions);
  store.set(REFRESH_TOKEN_COOKIE, session.refreshToken, refreshCookieOptions);

  return json({
    authenticated: true,
    expiresAt: getTokenExpiry(session.accessToken),
  });
}
