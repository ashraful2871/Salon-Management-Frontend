"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `PATCH /admin/agents/:id/status`: suspend, block or reactivate an agent (tier 2). */
export const updateAgentStatus = async (
  id: string,
  input: { status: "ACTIVE" | "SUSPENDED" | "BLOCKED"; reason: string },
): Promise<ApiResponse<{ id: string }>> => {
  const result = await adminSend<{ id: string }>(
    "patch",
    `/admin/agents/${encodeURIComponent(id)}/status`,
    input,
    "Couldn't change the agent's status. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminAgents);
    updateTag(TAGS.adminUser(id));
    revalidateTag(TAGS.adminUsers, "max");
  }
  return result;
};
