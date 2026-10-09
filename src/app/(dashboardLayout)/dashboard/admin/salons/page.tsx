import type { Metadata } from "next";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminSalons } from "@/services/admin/salons/getAdminSalons";
import type { AdminSalonFilters } from "@/services/admin/salons/types";
import { SalonsClient } from "./SalonsClient";

export const metadata: Metadata = {
  title: "Salons | Admin",
  description: "Review and manage salons",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/**
 * The URL is the state. With no `status` the queue opens on Pending when
 * anything is waiting, and on every salon otherwise; the All chip writes
 * `status=ALL` so it stays put.
 */
export default async function AdminSalonsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = one(sp.status);
  const filters: AdminSalonFilters = {
    q: one(sp.q),
    status: status === "ALL" ? undefined : status,
    division: one(sp.division),
    district: one(sp.district),
    area: one(sp.area),
    location: one(sp.location),
    minRating: one(sp.minRating),
    from: one(sp.from),
    to: one(sp.to),
    includeTest: one(sp.includeTest),
    sort: one(sp.sort),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const mePromise = getAdminMe();
  let response = await getAdminSalons(status ? filters : { ...filters, status: "PENDING_APPROVAL" });
  let shownStatus = status ?? "PENDING_APPROVAL";
  if (!status && response.success && (response.meta?.total ?? 0) === 0) {
    response = await getAdminSalons(filters);
    shownStatus = "ALL";
  }
  const me = await mePromise;

  return (
    <SalonsClient
      response={response}
      filters={{ ...filters, status: shownStatus }}
      permissions={me.data?.permissions ?? []}
      viewerId={me.data?.userId}
    />
  );
}
