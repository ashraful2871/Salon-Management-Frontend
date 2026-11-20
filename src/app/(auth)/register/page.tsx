import { cookies } from "next/headers";

import RegisterForm from "@/components/Auth/RegisterForm";
import { getAuthProviders } from "@/services/auth/getAuthProviders";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";
import { normalizeCode, REF_COOKIE } from "@/lib/referral";
import { referralTermsOf } from "@/lib/referral-terms";
import { safeInAppPath } from "@/lib/safe-path";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Signed-in visitors are turned away by the proxy; see the note in the login page.
 * A team invitation sends `?email=` (prefilled, read-only) and `?redirect=`
 * (back to `/invite?token=` once the account is verified).
 *
 * An invite code comes as `?ref=` (the invite page's button) or, failing that,
 * from the `sm_ref` cookie `/r/<code>` set; either one opens the form's code
 * field prefilled, and a code typed there replaces it.
 */
const RegisterPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const [providers, params, settings, jar] = await Promise.all([
    getAuthProviders(),
    searchParams,
    getPublicSettings(),
    cookies(),
  ]);
  const email = first(params.email)?.trim();
  const referral = referralSettingsOf(settings.success ? settings.data : null);
  const referralCode =
    normalizeCode(first(params.ref) ?? "") ?? normalizeCode(jar.get(REF_COOKIE)?.value ?? "") ?? undefined;

  return (
    <>
      <RegisterForm
        googleEnabled={providers.google}
        lockedEmail={email && email.includes("@") ? email : undefined}
        redirectTo={safeInAppPath(first(params.redirect)) ?? undefined}
        initialReferralCode={referralCode}
        referralOn={referral["referral.enabled"]}
        terms={referralTermsOf(referral).friend}
      />
    </>
  );
};

export default RegisterPage;
