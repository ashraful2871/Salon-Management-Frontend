import { getAdminTopups } from "@/services/payments/getAdminTopups";
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

  const response = await getAdminTopups({
    page: filters.page,
    limit: 20,
    status: filters.status,
    provider: filters.provider || undefined,
    searchTerm: filters.q || undefined,
  });

  return <TopupsClient response={response} filters={filters} />;
}
