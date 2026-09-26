import { cache } from "react";
import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";
import { getTokenExpiry, isTokenExpiring } from "@/lib/jwt";
import { refreshSession, type RefreshedSession } from "./refreshSession";
import type { UserRole } from "./auth-utils";

/**
 * Server-side access to the current session, with renewal built in.
 *
 * Every read goes through `getValidAccessToken`, so a component never has to
 * know whether the token in the cookie is still alive - if it is not, and a
 * refresh token is available, one round trip to the API replaces it before the
 * component's own request goes out. The user sees a page, not a login screen.
 *
 * Durable cookie writes are the Edge middleware's job (see `src/middleware.ts`)
 * and the keep-alive route's; this module renews in place for the request it is
 * serving and persists the result only when it is allowed to.
 */

export type SessionUser = {
  role: UserRole;
  email: string;
  name: string;
  /** False when the token predates the `name` claim and `name` is only the
   *  email prefix standing in for it. */
  hasName: boolean;
};

type DecodedToken = JwtPayload & {
  role: UserRole;
  email: string;
  name?: string;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * React server components render read-only: `cookies().set()` throws there, and
 * only a Server Action or Route Handler may write. That is fine - the token has
 * already been obtained and is usable for this request either way, and the
 * middleware writes the same pair on the next navigation - so a failure here is
 * swallowed rather than allowed to take the page down.
 */
const persist = (store: CookieStore, session: RefreshedSession): void => {
  try {
    store.set(ACCESS_TOKEN_COOKIE, session.accessToken, accessCookieOptions);
    store.set(REFRESH_TOKEN_COOKIE, session.refreshToken, refreshCookieOptions);
  } catch {
    // Read-only render; the middleware persists this same pair.
  }
};

const clear = (store: CookieStore): void => {
  try {
    store.delete(ACCESS_TOKEN_COOKIE);
    store.delete(REFRESH_TOKEN_COOKIE);
  } catch {
    // As above.
  }
};

/**
 * Renews unconditionally, ignoring whatever is in the access token cookie.
 *
 * `cache` is doing real work here. A dashboard page is a dozen server
 * components each calling a service, all rendering in parallel off one expired
 * cookie; without memoisation that is a dozen simultaneous refresh calls for a
 * single expiry. With it, the first one runs and the rest await the same
 * promise.
 */
export const refreshAccessToken = cache(async (): Promise<string | null> => {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) return null;

  const outcome = await refreshSession(refreshToken);

  if (outcome.status === "refreshed") {
    persist(store, outcome.session);
    return outcome.session.accessToken;
  }

  // Only a refusal ends the session. An unreachable API leaves the cookies
  // alone so the next request can try again.
  if (outcome.status === "rejected") {
    clear(store);
  }

  return null;
});

/** The access token to use for this request, renewed first if it is spent. */
export const getValidAccessToken = cache(async (): Promise<string | null> => {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;

  if (accessToken && !isTokenExpiring(accessToken)) {
    return accessToken;
  }

  const refreshed = await refreshAccessToken();

  // Falling back to the stale token matters when the API was merely
  // unreachable: it may still be within the backend's own tolerance, and a
  // rejected request is a better outcome than a page rendered as a stranger.
  return refreshed ?? accessToken;
});

/**
 * Who the request belongs to, or `null` for a visitor.
 *
 * This is the one place a token's signature is actually verified on the
 * frontend, with the `JWT_SECRET` the backend signs with. Note what it does
 * *not* do: it reads the role from the token rather than from the API, so a
 * role changed since the token was issued shows up only after the next refresh.
 * The backend re-reads the role from the database on every request, so it is
 * the authority - this is for choosing what to render.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const accessToken = await getValidAccessToken();

  if (!accessToken) return null;

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET as string,
    ) as DecodedToken;

    return {
      role: decoded.role,
      email: decoded.email,
      name: decoded.name || decoded.email.split("@")[0],
      hasName: Boolean(decoded.name),
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
});

/**
 * When the current access token runs out, in epoch milliseconds, or `null` if
 * there is no session. The client keep-alive uses this to schedule its first
 * renewal instead of polling blindly.
 */
export const getSessionExpiry = cache(async (): Promise<number | null> => {
  const store = await cookies();

  if (!store.get(REFRESH_TOKEN_COOKIE)?.value) return null;

  const accessToken = await getValidAccessToken();

  return accessToken ? getTokenExpiry(accessToken) : null;
});
