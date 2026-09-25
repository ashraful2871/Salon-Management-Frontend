import { NextResponse, type NextRequest } from "next/server";

import type { ApiResponse } from "@/lib/api-types";
import type { AuthResult } from "@/lib/auth-types";
import { applySessionOnResponse, extractTokens } from "@/lib/auth-session";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import {
  NO_STORE,
  OAUTH_COOKIE,
  OAUTH_COOKIE_OPTIONS,
  loginErrorRedirect,
} from "@/lib/google-oauth";
import { safeInAppPath } from "@/lib/safe-path";
import { setVerifyCookieOnResponse } from "@/lib/verify-cookie";

/**
 * Google's redirect URI. Hands `code`, `state` and the `sm_oauth` flow token to
 * the API, which does the exchange and the account work, then turns its answer
 * into cookies on this domain, as `loginUser` does:
 *
 * - `SIGNED_IN` sets the session and lands on `redirect` (or `/`) with
 *   `?loggedIn=true`;
 * - `VERIFICATION_REQUIRED` parks the ticket in `sm_verify` and goes to the
 *   code screen;
 * - anything else goes back to `/login?error=<code>`.
 *
 * Nothing from Google's query string is echoed into a page, and `sm_oauth` is
 * cleared on every path: a flow token is good for one try.
 */

export const dynamic = "force-dynamic";

type GoogleCallback = AuthResult & { redirect?: string | null };

/** `redirect` (or `/`) with `loggedIn=true` added, and never off this origin. */
const signedInUrl = (req: NextRequest, redirect: unknown): URL => {
  const home = new URL("/", req.url);
  const target = new URL(safeInAppPath(redirect) ?? "/", req.url);
  const url = target.origin === home.origin ? target : home;
  url.searchParams.set("loggedIn", "true");
  return url;
};

const handle = async (req: NextRequest): Promise<NextResponse> => {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const flowToken = req.cookies.get(OAUTH_COOKIE)?.value;

  if (error === "access_denied") return loginErrorRedirect(req, "google_cancelled");
  if (error || !code || !state) return loginErrorRedirect(req, "google_failed");
  // Google's half is here but ours is gone: the flow was already used (the
  // cookie is cleared on every pass) or outlived its 10 minutes.
  if (!flowToken) return loginErrorRedirect(req, "GOOGLE_STATE_MISMATCH");

  let apiRes: Response;
  let result: ApiResponse<GoogleCallback>;
  try {
    apiRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientIpHeaders()),
        },
        body: JSON.stringify({ code, state, flowToken }),
        cache: "no-store",
      },
    );
    result = await apiRes.json();
  } catch (e) {
    console.error("google callback error:", (e as Error).message);
    return loginErrorRedirect(req, "google_failed");
  }

  const data = result.success ? result.data : undefined;
  if (!data) return loginErrorRedirect(req, result.errorCode);

  if (data.status === "VERIFICATION_REQUIRED") {
    const res = NextResponse.redirect(new URL("/verify-email", req.url), {
      headers: NO_STORE,
    });
    setVerifyCookieOnResponse(res, data, data.redirect, "google");
    return res;
  }

  const tokens = extractTokens(apiRes, result);
  if (!tokens) return loginErrorRedirect(req, "google_failed");

  const res = NextResponse.redirect(signedInUrl(req, data.redirect), {
    headers: NO_STORE,
  });
  applySessionOnResponse(res, tokens);
  return res;
};

export async function GET(req: NextRequest) {
  const res = await handle(req);
  res.cookies.delete({ name: OAUTH_COOKIE, path: OAUTH_COOKIE_OPTIONS.path });
  return res;
}
