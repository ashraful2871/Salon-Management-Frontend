import type { Metadata } from "next";
import { ReferralsClient } from "@/components/Admin/referrals/ReferralsClient";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminReferral } from "@/services/referral/getAdminReferral";
import { getAdminReferrals } from "@/services/referral/getAdminReferrals";
import type { AdminReferralQuery, ReferralStatus } from "@/services/referral/types";

export const metadata: Metadata = { title: "Referrals list | Admin" };

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The URL is the state; every filter is a search param. `?open=<id>` opens a referral's sheet. */
export default async function ReferralListPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const from = one(sp.from);
  const to = one(sp.to);
  const filters: AdminReferralQuery = {
    q: one(sp.q),
    status: one(sp.status) as ReferralStatus | undefined,
    flagged: one(sp.flagged) === "true" || undefined,
    from: from && DAY.test(from) ? from : undefined,
    to: to && DAY.test(to) ? to : undefined,
    includeTest: one(sp.includeTest) === "true" || undefined,
    page: Math.max(1, Number(one(sp.page)) || 1),
  };
  const openId = one(sp.open);

  const [response, me, opened] = await Promise.all([
    getAdminReferrals(filters),
    getAdminMe(),
    openId ? getAdminReferral(openId) : Promise.resolve(null),
  ]);

  return (
    <ReferralsClient
      // A new `?open=` starts the sheet on that referral.
      key={openId ?? "list"}
      response={response}
      filters={filters}
      permissions={me.data?.permissions ?? []}
      initial={
        openId && opened
          ? { id: openId, detail: opened.success ? (opened.data ?? null) : null, error: opened.success ? null : opened.message }
          : null
      }
    />
  );
}
