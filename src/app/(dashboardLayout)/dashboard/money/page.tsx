import { ErrorState } from "@/components/Shared/ErrorState";
import { MoneyOverview } from "@/components/Money/MoneyOverview";
import { DuesReturnToast } from "@/components/Money/DuesReturnToast";
import { getOwnerMoneySummary } from "@/services/owner/getOwnerMoneySummary";
import { getSelectedSalonId } from "@/lib/branch-cookie";

export const metadata = { title: "Money" };
export const dynamic = "force-dynamic";

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dues = (await searchParams).dues;
  // Back from a dues payment: read past the cache so the card shows the result.
  const result = await getOwnerMoneySummary(await getSelectedSalonId(), { fresh: !!dues });

  return (
    <>
      <DuesReturnToast outcome={typeof dues === "string" ? dues : undefined} />
      {!result.success || !result.data ? (
        <ErrorState message={result.message} />
      ) : (
        <MoneyOverview summary={result.data} />
      )}
    </>
  );
}
