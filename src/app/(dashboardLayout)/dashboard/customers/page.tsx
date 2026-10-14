import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { CustomersClient } from "@/components/Owner/customers/CustomersClient";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getOwnerCustomers } from "@/services/owner/getOwnerCustomers";
import {
  CUSTOMER_SEGMENTS,
  type CustomerFilters,
  type CustomerSegment,
} from "@/services/owner/customer-types";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, role] = await Promise.all([searchParams, getUserRoles()]);
  // Owners follow the branch switcher; staff are scoped to their salon by the API.
  const salonId = role === "SALON_OWNER" ? await getSelectedSalonId() : undefined;

  const segmentParam = first(params.segment);
  const segment = CUSTOMER_SEGMENTS.some((s) => s.value === segmentParam)
    ? (segmentParam as CustomerSegment)
    : undefined;
  const search = first(params.q)?.trim().slice(0, 100) || undefined;

  const filters: CustomerFilters = {
    ...(salonId && { salonId }),
    ...(segment && { segment }),
    ...(search && { search }),
  };
  const result = await getOwnerCustomers(filters);

  return (
    <div>
      <PageHeader title="Customers" description="Who comes back, what they spend, and your notes on them." />
      {!result.success || !result.data ? (
        <ErrorState message={result.message} />
      ) : (
        <CustomersClient
          key={JSON.stringify(filters)}
          initial={result.data.items}
          nextCursor={result.data.nextCursor}
          counts={result.data.counts}
          filters={filters}
        />
      )}
    </div>
  );
}
