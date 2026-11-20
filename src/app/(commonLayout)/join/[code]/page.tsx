import type { Metadata } from "next";
import { cache } from "react";

import heroImage from "@/assets/hero-salon.jpg";
import { InviteLanding, type InviteView } from "@/components/Referral/InviteLanding";
import { normalizeCode } from "@/lib/referral";
import { percentLabel } from "@/lib/referral-terms";
import { SITE } from "@/lib/site";
import { getAuthProviders } from "@/services/auth/getAuthProviders";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getInvite } from "@/services/referral/getInvite";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";

/**
 * `/join/<code>`: where an invite link lands (via `/r/<code>`, which also sets
 * `sm_ref`). Valid, signed in, paused or invalid; see `InviteLanding`. Per
 * visitor (the lookup reads the session), so never cached, and never indexed.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

/**
 * The code to look up, or null to skip the call: `/join/invalid` is where
 * `/r/` sends a malformed code ("INVALID" would pass the code's shape), and
 * anything else that can't be a code is refused the same way the API would.
 */
const codeOf = (raw: string): string | null =>
  raw.trim().toLowerCase() === "invalid" ? null : normalizeCode(raw);

/** One lookup per request, shared by the metadata and the page. */
const lookup = cache(async (code: string | null) => (code ? getInvite(code) : null));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const code = codeOf((await params).code);
  const [result, settings] = await Promise.all([lookup(code), getPublicSettings()]);
  const invite = result?.success ? result.data : undefined;
  const percent =
    invite?.terms.percent ??
    referralSettingsOf(settings.success ? settings.data : null)["referral.refereePercent"];

  // Link previews (WhatsApp, Messenger) are fetched signed out, so they get this.
  const live = !!invite?.valid && invite.programOn;
  const title = live
    ? `${invite.firstName || "A friend"} invited you to ${SITE.name}`
    : `You're invited to ${SITE.name}`;
  const description = live
    ? `Join ${SITE.name} and get ${percentLabel(percent)} off your first booking at trusted salons and beauty at home.`
    : SITE.description;
  const image = { url: heroImage.src, width: heroImage.width, height: heroImage.height, alt: SITE.name };

  return {
    title: "You're invited",
    description,
    robots: { index: false, follow: false },
    openGraph: { siteName: SITE.name, type: "website", locale: "en_BD", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function JoinPage({ params }: Params) {
  const code = codeOf((await params).code);
  const [result, settings, role, providers] = await Promise.all([
    lookup(code),
    getPublicSettings(),
    getUserRoles(),
    getAuthProviders(),
  ]);
  const referral = referralSettingsOf(settings.success ? settings.data : null);
  const invite = result?.success ? result.data : undefined;
  const programOn = invite?.programOn ?? referral["referral.enabled"];

  // Signed in beats everything (invites are for new accounts), then the kill
  // switch, then the code itself.
  const view: InviteView =
    role || invite?.signedIn
      ? {
          state: "signed_in",
          customer: role === "CUSTOMER",
          programOn,
          earnPercent: referral["referral.referrerPercent"],
        }
      : !programOn
        ? { state: "paused" }
        : code && invite?.valid
          ? { state: "valid", code, firstName: invite.firstName, terms: invite.terms }
          : { state: "invalid", retryCode: code && !invite ? code : undefined };

  return <InviteLanding view={view} googleEnabled={providers.google} />;
}
