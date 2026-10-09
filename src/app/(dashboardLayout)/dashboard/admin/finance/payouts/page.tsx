import { getAdminMe } from "@/services/admin/getAdminMe";
import { getPayouts } from "@/services/admin/finance/getPayouts";
import type { PayoutStatus } from "@/services/admin/finance/types";
import { isOn } from "@/components/Admin/finance/range";
import { can } from "@/lib/admin-permissions";
import { PayoutsClient } from "./PayoutsClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES: PayoutStatus[] = ["PENDING", "PROCESSING", "PAID", "FAILED"];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function PayoutsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = (first(params.status) ?? "").toUpperCase();
  const status = STATUSES.includes(raw as PayoutStatus) ? (raw as PayoutStatus) : "PENDING";
  const page = Math.max(1, Math.floor(Number(first(params.page))) || 1);
  const includeTest = isOn(params.includeTest);

  const [response, me] = await Promise.all([
    getPayouts({ status, page, includeTest: includeTest || undefined }),
    getAdminMe(),
  ]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];

  return (
    <PayoutsClient
      response={response}
      status={status}
      page={page}
      includeTest={includeTest}
      canManage={can(permissions, "finance.payouts")}
      canExport={can(permissions, "finance.export")}
    />
  );
}
