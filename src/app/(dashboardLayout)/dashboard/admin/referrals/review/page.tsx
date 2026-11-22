import type { Metadata } from "next";
import { monthStartDhaka } from "@/components/Admin/referrals/filters";
import { ReviewQueue, type ReviewItem } from "@/components/Admin/referrals/ReviewQueue";
import { ErrorState } from "@/components/Shared/ErrorState";
import { guardPermission } from "@/lib/auth-guard";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminReferral } from "@/services/referral/getAdminReferral";
import { getAdminReferrals } from "@/services/referral/getAdminReferrals";
import { getAdminRewards } from "@/services/referral/getAdminRewards";
import type { AdminRewardRow } from "@/services/referral/types";

export const metadata: Metadata = { title: "Referral review | Admin" };

/** The queue shows this many cards; decide them and the next ones come up. */
const QUEUE_SIZE = 20;

/**
 * Referrals whose referrer reward is held for review, oldest first. The
 * rewards list is newest first, so the oldest are on its last page(s). Each
 * card gets the referral's detail and the referrer's count for this month.
 */
export default async function ReferralReviewPage() {
  await guardPermission("referrals.manage");

  const query = { status: "PENDING_REVIEW", kind: "REFERRER_BONUS", includeTest: true } as const;
  const first = await getAdminRewards({ ...query, page: 1 });
  if (!first.success) return <ErrorState title="Couldn't load the review queue" message={first.message} />;

  const totalPages = first.meta?.totalPages ?? 1;
  const tail =
    totalPages > 1
      ? await Promise.all(
          [totalPages, totalPages - 1]
            .filter((p) => p > 1)
            .map((page) => getAdminRewards({ ...query, page })),
        )
      : [];
  // Oldest first: last page reversed, then the one before it, then page 1.
  const pages: AdminRewardRow[][] = [...tail.map((r) => (r.success ? (r.data ?? []) : [])), first.data ?? []];
  const seen = new Set<string>();
  const held = pages
    .flatMap((rows) => [...rows].reverse())
    .filter((r) => r.referral && !seen.has(r.referral.id) && seen.add(r.referral.id))
    .slice(0, QUEUE_SIZE);

  const monthStart = monthStartDhaka();
  const [me, details] = await Promise.all([
    getAdminMe(),
    Promise.all(held.map((r) => getAdminReferral(r.referral!.id))),
  ]);

  // Referrals made on each referrer's code since the 1st (Dhaka), test data included.
  const codes = [...new Set(held.map((r) => r.referral!.code))];
  const counts = new Map(
    await Promise.all(
      codes.map(async (code) => {
        const res = await getAdminReferrals({ q: code, from: monthStart, includeTest: true });
        return [code, res.success ? (res.meta?.total ?? null) : null] as const;
      }),
    ),
  );

  const items: ReviewItem[] = held.flatMap((reward, i) => {
    const d = details[i];
    if (!d.success || !d.data) return [];
    return [{ reward, detail: d.data, thisMonth: counts.get(reward.referral!.code) ?? null }];
  });

  return (
    <ReviewQueue
      items={items}
      total={first.meta?.total ?? items.length}
      permissions={me.data?.permissions ?? []}
    />
  );
}
