import type { Metadata } from "next";
import { getAdminAgents } from "@/services/admin/agents/getAdminAgents";
import { getAdminAreas } from "@/services/admin/agents/getAdminAreas";
import { AgentsClient } from "./AgentsClient";

export const metadata: Metadata = { title: "Agents | Admin" };

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function AgentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters = { q: one(sp.q), page: Math.max(1, Number(one(sp.page)) || 1) };
  const [response, areas] = await Promise.all([getAdminAgents(filters), getAdminAreas()]);

  return (
    <AgentsClient
      response={response}
      areas={areas.success && Array.isArray(areas.data) ? areas.data : []}
      filters={filters}
    />
  );
}
