import type { Metadata } from "next";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminUsers } from "@/services/admin/users/getAdminUsers";
import type { AdminUserFilters } from "@/services/admin/users/types";
import { UsersClient } from "./UsersClient";

export const metadata: Metadata = { title: "Users | Admin" };

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** The URL is the state: every filter, the sort and the page come from it. */
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters: AdminUserFilters = {
    q: one(sp.q),
    role: one(sp.role),
    status: one(sp.status),
    verified: one(sp.verified),
    from: one(sp.from),
    to: one(sp.to),
    hasBookings: one(sp.hasBookings),
    provider: one(sp.provider),
    includeTest: one(sp.includeTest),
    sort: one(sp.sort),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const [response, me] = await Promise.all([getAdminUsers(filters), getAdminMe()]);

  return (
    <UsersClient
      response={response}
      filters={filters}
      permissions={me.data?.permissions ?? []}
    />
  );
}
