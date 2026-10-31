import type { Metadata } from "next";
import { HomePolicyClient } from "@/components/Admin/home-service/policy/HomePolicyClient";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getHomePolicy } from "@/services/home-service/getHomePolicy";

export const metadata: Metadata = {
  title: "Fees & policy | Admin",
  description: "Home Service fees and cancellation rules",
};

export default async function HomePolicyPage() {
  const [response, me] = await Promise.all([getHomePolicy(), getAdminMe()]);
  return <HomePolicyClient response={response} permissions={me.data?.permissions ?? []} />;
}
