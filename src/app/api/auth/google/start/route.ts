import { NextResponse, type NextRequest } from "next/server";

import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { deviceHeaders } from "@/lib/device-headers";
import { normalizeCode, REF_COOKIE } from "@/lib/referral";
import {
  NO_STORE,
  OAUTH_COOKIE,
  OAUTH_COOKIE_OPTIONS,
  loginErrorRedirect,
} from "@/lib/google-oauth";
import { safeInAppPath } from "@/lib/safe-path";

/**
 * "Continue with Google": asks the API for an authorize URL and sends the
 * browser there. The API's flow token rides along in `sm_oauth`, scoped to
 * `/api/auth/google`, for the callback to hand back.
 *
 * A plain GET that the button links to, so it must never be prefetched or
 * cached: every hit starts a fresh flow.
 */

export const dynamic = "force-dynamic";

type GoogleStart = { authorizeUrl: string; flowToken: string };

/**
 * The invite code for a Google sign-up: `?ref=` (the field's checked value on
 * register, or the invite page's code), else the `sm_ref` link cookie. It
 * counts as a link referral when it came from the cookie, matches it, or the
 * button said `src=link`. The API keeps it only if Google creates a new
 * account; a bad code there is skipped, never an error.
 */
const referralOf = (req: NextRequest): { code: string; fromLink: boolean } | null => {
  const params = req.nextUrl.searchParams;
  const cookie = normalizeCode(req.cookies.get(REF_COOKIE)?.value ?? "");
  const typed = normalizeCode(params.get("ref") ?? "");
  if (typed) return { code: typed, fromLink: params.get("src") === "link" || typed === cookie };
  return cookie ? { code: cookie, fromLink: true } : null;
};

export async function GET(req: NextRequest) {
  const redirect = safeInAppPath(req.nextUrl.searchParams.get("redirect"));
  const referral = referralOf(req);

  let result: ApiResponse<GoogleStart> | null = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientIpHeaders()),
          ...(await deviceHeaders()),
          ...(referral?.fromLink ? { "X-Referral-Source": "link" } : {}),
        },
        body: JSON.stringify({
          ...(redirect ? { redirect } : {}),
          ...(referral ? { referralCode: referral.code } : {}),
        }),
        cache: "no-store",
      },
    );
    result = await res.json();
  } catch (error) {
    console.error("google start error:", (error as Error).message);
  }

  const data = result?.success ? result.data : undefined;
  if (!data?.authorizeUrl || !data.flowToken) {
    return loginErrorRedirect(req, result?.errorCode);
  }

  const res = NextResponse.redirect(data.authorizeUrl, { headers: NO_STORE });
  res.cookies.set(OAUTH_COOKIE, data.flowToken, OAUTH_COOKIE_OPTIONS);
  return res;
}
