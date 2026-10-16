import RegisterForm from "@/components/Auth/RegisterForm";
import { getAuthProviders } from "@/services/auth/getAuthProviders";
import { safeInAppPath } from "@/lib/safe-path";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Signed-in visitors are turned away by the proxy; see the note in the login page.
 * A team invitation sends `?email=` (prefilled, read-only) and `?redirect=`
 * (back to `/invite?token=` once the account is verified).
 */
const RegisterPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const [providers, params] = await Promise.all([getAuthProviders(), searchParams]);
  const email = first(params.email)?.trim();

  return (
    <>
      <RegisterForm
        googleEnabled={providers.google}
        lockedEmail={email && email.includes("@") ? email : undefined}
        redirectTo={safeInAppPath(first(params.redirect)) ?? undefined}
      />
    </>
  );
};

export default RegisterPage;
