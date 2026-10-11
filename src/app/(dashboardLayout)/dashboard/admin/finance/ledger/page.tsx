import { getAdminMe } from "@/services/admin/getAdminMe";
import { getLedger } from "@/services/admin/finance/getLedger";
import { getReconciliation } from "@/services/admin/finance/getReconciliation";
import { LEDGER_ACCOUNTS } from "@/services/admin/finance/types";
import { parsePreset, presetRange } from "@/components/Admin/finance/range";
import { can } from "@/lib/admin-permissions";
import { LedgerClient } from "./LedgerClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function LedgerPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const account = (first(params.account) ?? "").toUpperCase();
  const filters = {
    account: (LEDGER_ACCOUNTS as readonly string[]).includes(account) ? account : "",
    salonId: (first(params.salonId) ?? "").trim(),
    appointmentId: (first(params.appointmentId) ?? "").trim(),
    payoutId: (first(params.payoutId) ?? "").trim(),
    range: parsePreset(first(params.range) ?? "all"),
  };
  const { from, to } = presetRange(filters.range);

  const [ledger, reconciliation, me] = await Promise.all([
    getLedger({
      account: filters.account || undefined,
      salonId: filters.salonId || undefined,
      appointmentId: filters.appointmentId || undefined,
      payoutId: filters.payoutId || undefined,
      from,
      to,
    }),
    getReconciliation(),
    getAdminMe(),
  ]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];

  return (
    <LedgerClient
      // A new filter set starts a fresh "Load more" list.
      key={JSON.stringify(filters)}
      filters={filters}
      from={from}
      to={to}
      ledger={ledger}
      reconciliation={reconciliation}
      canExport={can(permissions, "finance.export")}
    />
  );
}
