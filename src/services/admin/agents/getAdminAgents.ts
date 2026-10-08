import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminAgentsData } from "./types";

/** `GET /admin/agents`: agents with area, status and 2FA; pending invitations on page 1. */
export const getAdminAgents = (filters: { q?: string; page?: number }): Promise<ApiResponse<AdminAgentsData>> =>
  adminGet<AdminAgentsData>(
    `/admin/agents${toQuery({ ...filters, limit: 50 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminAgents] } },
    "Couldn't load agents. Please try again.",
  );
