import { NextResponse, type NextRequest } from "next/server";

import { normalizeCode, REF_COOKIE } from "@/lib/referral";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";

/**
 * `/r/<code>`: the invite link. Remembers the code in `sm_ref` for
 * `referral.attributionDays` (the last link clicked wins; a code typed in the
 * form still beats it), then sends a visitor to the invite landing and a
 * signed-in customer to their own Refer page - invites are for new accounts.
 *
 * Outside the route groups, never cached. Link to it with a plain `<a>`, not
 * `<Link>`, so nothing prefetches it.
 */
export const dynamic = "force-dynamic";

const noStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode((await params).code);
  if (!code) return noStore(NextResponse.redirect(new URL("/join/invalid", request.url), 307));

  const [settings, role] = await Promise.all([getPublicSettings(), getUserRoles()]);
  const days = referralSettingsOf(settings.success ? settings.data : null)["referral.attributionDays"] || 30;

  // The Refer page is customers only; any other account gets the invite
  // page's signed-in state instead of a "not available" bounce.
  const target = role === "CUSTOMER" ? "/dashboard/referrals?invite=own" : `/join/${code}`;
  const response = NextResponse.redirect(new URL(target, request.url), 307);
  response.cookies.set(REF_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 86_400,
  });
  return noStore(response);
}
