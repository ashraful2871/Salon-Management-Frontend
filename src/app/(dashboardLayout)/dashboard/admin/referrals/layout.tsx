import { ReferralTabs } from "@/components/Admin/referrals/ReferralTabs";
import { guardPermission, guardRoute } from "@/lib/auth-guard";
import { getAdminInbox } from "@/services/admin/getAdminInbox";
import { getAdminMe } from "@/services/admin/getAdminMe";

/**
 * Growth → Referrals. Role from `ROUTE_ROLES`, then referrals.view; Review and
 * Settings guard their own extra permission. The tabs sit above every page.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await guardRoute("/dashboard/admin/referrals");
  await guardPermission("referrals.view");

  const [me, inbox] = await Promise.all([getAdminMe(), getAdminInbox()]);
  const reviewCount = inbox.success ? (inbox.data?.find((i) => i.key === "referrals.review")?.count ?? 0) : 0;

  return (
    <div className="min-w-0 space-y-5">
      <ReferralTabs permissions={me.data?.permissions ?? []} reviewCount={reviewCount} />
      {children}
    </div>
  );
}
