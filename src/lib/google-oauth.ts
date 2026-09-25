// Server-only: shared by the two Google route handlers under
// `app/api/auth/google/`. No Google secret or client ID lives here - the API
// builds the authorize URL and does the code exchange.

import { NextResponse, type NextRequest } from "next/server";

/**
 * The API's signed flow token (state, nonce and PKCE verifier) between the
 * start and the callback. Scoped to the two routes, and short-lived: Google's
 * consent screen is the only thing in between.
 */
export const OAUTH_COOKIE = "sm_oauth";

export const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/api/auth/google",
  maxAge: 600,
} as const;

export const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Back to `/login?error=<code>`. Only a bare identifier survives, so nothing
 * but our own error codes can reach the page.
 */
export const loginErrorRedirect = (
  req: NextRequest,
  code: string | null | undefined,
): NextResponse => {
  const safe = code && /^[A-Za-z_]{1,64}$/.test(code) ? code : "google_failed";
  return NextResponse.redirect(new URL(`/login?error=${safe}`, req.url), {
    headers: NO_STORE,
  });
};
