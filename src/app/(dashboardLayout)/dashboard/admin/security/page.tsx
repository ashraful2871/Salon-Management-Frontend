import type { Metadata } from "next";
import { PageHeader } from "@/components/Shared/PageHeader";
import { SecurityClient } from "@/components/Admin/security/SecurityClient";
import { getAdminMe } from "@/services/admin/getAdminMe";

export const metadata: Metadata = { title: "Security" };

/**
 * Two-factor sign-in for admins and agents. Until it is set up, the admin
 * layouts send every admin page here (the API refuses them with
 * TWO_FACTOR_SETUP_REQUIRED anyway).
 */
export default async function AdminSecurityPage() {
  const me = await getAdminMe();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Security"
        description="Two-factor sign-in protects the admin console with a code from your phone."
      />
      {me.success && me.data ? (
        <SecurityClient mfa={me.data.mfa} email={me.data.email} />
      ) : (
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
          {me.message || "Couldn't load your security settings."}
        </p>
      )}
    </div>
  );
}
