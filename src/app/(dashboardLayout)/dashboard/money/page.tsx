import { ErrorState } from "@/components/Shared/ErrorState";
import { MoneyOverview } from "@/components/Money/MoneyOverview";
import { getOwnerMoneySummary } from "@/services/owner/getOwnerMoneySummary";
import { getSelectedSalonId } from "@/lib/branch-cookie";

export const metadata = { title: "Money" };
export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const result = await getOwnerMoneySummary(await getSelectedSalonId());

  return !result.success || !result.data ? (
    <ErrorState message={result.message} />
  ) : (
    <MoneyOverview summary={result.data} />
  );
}
