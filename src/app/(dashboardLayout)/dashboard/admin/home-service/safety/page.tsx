import type { Metadata } from "next";
import { HomeSafetyClient } from "@/components/Admin/home-service/HomeSafetyClient";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminHomeReports } from "@/services/home-service/getAdminHomeReports";
import type { HomeReportStatus } from "@/services/home-service/types";

export const metadata: Metadata = {
  title: "Home Service safety | Admin",
  description: "Reports from customers and experts during home visits",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const STATUSES: HomeReportStatus[] = ["OPEN", "REVIEWING", "ACTIONED", "DISMISSED"];

/** The URL is the state. With no `status` the queue is OPEN + REVIEWING. */
export default async function HomeSafetyPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const asked = one(sp.status) as HomeReportStatus | undefined;
  const status = asked && STATUSES.includes(asked) ? asked : undefined;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const [response, me] = await Promise.all([getAdminHomeReports(status, page), getAdminMe()]);

  return (
    <HomeSafetyClient
      key={status ?? "queue"}
      response={response}
      status={status}
      permissions={me.data?.permissions ?? []}
    />
  );
}
