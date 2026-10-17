import { ErrorState } from "@/components/Shared/ErrorState";
import { PayoutsClient } from "@/components/Money/PayoutsClient";
import { getOwnerPayouts } from "@/services/owner/getOwnerPayouts";
import type { PayoutStatus } from "@/services/owner/money-types";

export const metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

const STATUSES = new Set(["PENDING", "APPROVED", "PROCESSING", "PAID", "FAILED", "CANCELLED"]);

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const requested = (await searchParams).status;
  const status = requested && STATUSES.has(requested) ? (requested as PayoutStatus) : undefined;
  const result = await getOwnerPayouts({ status });

  if (!result.success || !result.data) return <ErrorState message={result.message} />;

  return (
    <PayoutsClient
      key={status ?? "all"}
      initial={result.data.items}
      nextCursor={result.data.nextCursor}
      status={status}
    />
  );
}
