import type { Metadata } from "next";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminApplications } from "@/services/admin/applications/getAdminApplications";
import type { AdminApplicationFilters } from "@/services/admin/applications/types";
import { ApplicationsClient } from "./ApplicationsClient";

export const metadata: Metadata = { title: "Owner applications | Admin" };

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Same queue rules as salons: Pending first when anything waits; the All chip writes `status=ALL`. */
export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = one(sp.status);
  const filters: AdminApplicationFilters = {
    search: one(sp.search),
    status: status === "ALL" ? undefined : status,
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const mePromise = getAdminMe();
  let response = await getAdminApplications(status ? filters : { ...filters, status: "PENDING" });
  let shownStatus = status ?? "PENDING";
  if (!status && response.success && (response.meta?.total ?? 0) === 0) {
    response = await getAdminApplications(filters);
    shownStatus = "ALL";
  }
  const me = await mePromise;

  return (
    <ApplicationsClient
      response={response}
      filters={{ ...filters, status: shownStatus }}
      permissions={me.data?.permissions ?? []}
    />
  );
}
