import type { Metadata } from "next";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminTeam } from "@/services/admin/team/getAdminTeam";
import { TeamClient } from "./TeamClient";

export const metadata: Metadata = { title: "Team | Admin" };

export default async function TeamPage() {
  const [response, me] = await Promise.all([getAdminTeam(), getAdminMe()]);
  return <TeamClient response={response} viewerId={me.data?.userId} />;
}
