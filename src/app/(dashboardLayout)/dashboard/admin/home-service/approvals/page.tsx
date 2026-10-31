import type { Metadata } from "next";
import { HomeApprovalsClient, type BranchStatus } from "@/components/Admin/home-service/HomeApprovalsClient";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminHomeProfiles } from "@/services/home-service/getAdminHomeProfiles";

export const metadata: Metadata = {
  title: "Home Service approvals | Admin",
  description: "Review branches asking to offer Home Service",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const STATUSES: BranchStatus[] = ["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"];

/** The URL is the state. */
export default async function HomeApprovalsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const asked = one(sp.status) as BranchStatus | undefined;
  const status = asked && STATUSES.includes(asked) ? asked : "PENDING_REVIEW";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const [response, me] = await Promise.all([getAdminHomeProfiles(status, page), getAdminMe()]);

  return (
    <HomeApprovalsClient
      key={status}
      response={response}
      status={status}
      permissions={me.data?.permissions ?? []}
    />
  );
}
