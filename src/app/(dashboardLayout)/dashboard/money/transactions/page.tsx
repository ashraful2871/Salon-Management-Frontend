import { ErrorState } from "@/components/Shared/ErrorState";
import { TransactionsClient } from "@/components/Money/TransactionsClient";
import { DATE_PRESETS, presetRange } from "@/components/Money/money-format";
import { getOwnerTransactions } from "@/services/owner/getOwnerTransactions";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import {
  TRANSACTION_TYPES,
  type TransactionFilters,
  type TransactionType,
} from "@/services/owner/money-types";

export const metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [access, selected] = await Promise.all([getMyAccess(), getSelectedSalonId()]);
  const branches = (access.success ? (access.data ?? []) : [])
    .filter((b) => b.role === "OWNER")
    .map(({ salonId, salonName }) => ({ salonId, salonName }));

  // `?branch=` wins; otherwise the branch switcher's choice ("all" = every branch).
  const branchParam = first(params.branch);
  const branch =
    branchParam === "all" || branches.some((b) => b.salonId === branchParam)
      ? branchParam!
      : (selected ?? "all");
  const typeParam = first(params.type);
  const type = TRANSACTION_TYPES.some((t) => t.value === typeParam)
    ? (typeParam as TransactionType)
    : undefined;
  const rangeParam = first(params.range);
  const range = DATE_PRESETS.some((p) => p.value === rangeParam) ? rangeParam! : "all";

  const filters: TransactionFilters = {
    ...(branch !== "all" && { salonId: branch }),
    ...(type && { type }),
    ...presetRange(range),
  };
  const result = await getOwnerTransactions(filters);

  if (!result.success || !result.data) return <ErrorState message={result.message} />;

  return (
    <TransactionsClient
      key={JSON.stringify(filters)}
      initial={result.data.items}
      nextCursor={result.data.nextCursor}
      filters={filters}
      branches={branches}
      branch={branch}
      range={range}
    />
  );
}
