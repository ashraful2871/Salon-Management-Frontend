import { getAdminTopups } from "@/services/payments/getAdminTopups";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { can } from "@/lib/admin-permissions";
import { TopupsClient } from "./TopupsClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function TopupsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const filters = {
    page: Math.max(1, Math.floor(Number(first(params.page))) || 1),
    status: (first(params.status) || "SUCCESS").toUpperCase(),
    provider: (first(params.provider) || "").toUpperCase(),
    q: (first(params.q) || "").trim(),
  };

  const [response, me] = await Promise.all([getAdminTopups({
    page: filters.page,
    limit: 20,
    status: filters.status,
    provider: filters.provider || undefined,
    searchTerm: filters.q || undefined,
  }), getAdminMe()]);

  return (
    <TopupsClient
      response={response}
      filters={filters}
      canExport={me.success && can(me.data?.permissions, "finance.export")}
    />
  );
}
