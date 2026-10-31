import type { Metadata } from "next";
import { HomeExpertsClient } from "@/components/Admin/home-service/HomeExpertsClient";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminHomeExperts } from "@/services/home-service/getAdminHomeExperts";
import type { ExpertVerification } from "@/services/home-service/types";

export const metadata: Metadata = {
  title: "Home experts | Admin",
  description: "Verify the experts who visit customers at home",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const STATES: ExpertVerification[] = ["PENDING", "VERIFIED", "SUSPENDED", "REJECTED", "DRAFT"];

/** The URL is the state. */
export default async function HomeExpertsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const asked = one(sp.status) as ExpertVerification | undefined;
  const status = asked && STATES.includes(asked) ? asked : "PENDING";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const [response, me] = await Promise.all([getAdminHomeExperts(status, page), getAdminMe()]);

  return (
    <HomeExpertsClient
      key={status}
      response={response}
      status={status}
      permissions={me.data?.permissions ?? []}
    />
  );
}
