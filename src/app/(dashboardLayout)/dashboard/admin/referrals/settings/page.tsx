import type { Metadata } from "next";
import { ReferralSettingsClient, type PendingApproval } from "@/components/Admin/referrals/ReferralSettingsClient";
import { ErrorState } from "@/components/Shared/ErrorState";
import { guardPermission } from "@/lib/auth-guard";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getApprovals } from "@/services/admin/approvals/getApprovals";
import { getSettings } from "@/services/admin/settings/getSettings";

export const metadata: Metadata = { title: "Referral settings | Admin" };

/** The two program switches live in the `flags` group; the rest is the `referral` group. */
const FLAG_KEYS = new Set(["referral.enabled", "referral.redemptionsEnabled"]);

/**
 * Program settings: the `referral` group + its two flags from
 * `GET /admin/settings` (settings.view, which every referrals.policy role
 * has). Read-only without referrals.policy (flags without flags.manage).
 * Pending four-eyes changes show as "Waiting for another admin".
 */
export default async function ReferralSettingsPage() {
  await guardPermission("settings.view");

  const [response, me, approvals] = await Promise.all([getSettings(), getAdminMe(), getApprovals("PENDING")]);
  if (!response.success || !response.data) {
    return <ErrorState title="Couldn't load the referral settings" message={response.message} />;
  }

  const all = response.data.groups.flatMap((g) => g.settings);
  const settings = [
    ...all.filter((s) => FLAG_KEYS.has(s.key)),
    ...all.filter((s) => s.group === "referral"),
  ];
  const pending: PendingApproval[] = (approvals.success ? (approvals.data?.items ?? []) : [])
    .filter((a) => a.action === "setting.update" && a.status === "PENDING")
    .flatMap((a) => {
      const key = typeof a.payload.key === "string" ? a.payload.key : null;
      return key && key.startsWith("referral.") ? [{ key, summary: a.summary, mine: a.mine }] : [];
    });

  return <ReferralSettingsClient settings={settings} permissions={me.data?.permissions ?? []} pending={pending} />;
}
