import type { Metadata } from "next";
import { RewardsClient } from "@/components/Admin/referrals/RewardsClient";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminRewards } from "@/services/referral/getAdminRewards";
import type { AdminRewardQuery, RewardKind, RewardStatus } from "@/services/referral/types";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";

export const metadata: Metadata = { title: "Referral rewards | Admin" };

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** The URL is the state. The Grant dialog starts from the referrer terms in force. */
export default async function ReferralRewardsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters: AdminRewardQuery = {
    q: one(sp.q),
    kind: one(sp.kind) as RewardKind | undefined,
    status: one(sp.status) as RewardStatus | undefined,
    includeTest: one(sp.includeTest) === "true" || undefined,
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const [response, me, settings] = await Promise.all([getAdminRewards(filters), getAdminMe(), getPublicSettings()]);
  const s = referralSettingsOf(settings.success ? settings.data : null);

  return (
    <RewardsClient
      response={response}
      filters={filters}
      permissions={me.data?.permissions ?? []}
      grantDefaults={{
        percent: s["referral.referrerPercent"],
        maxDiscountMinor: s["referral.referrerMaxDiscountMinor"],
        validDays: s["referral.referrerValidDays"],
        scope: s["referral.referrerScope"],
      }}
    />
  );
}
