import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { SupportAssignee } from "./types";

/** `GET /admin/support/assignees`: admins who can answer tickets. */
export const getSupportAssignees = (): Promise<ApiResponse<SupportAssignee[]>> =>
  adminGet<SupportAssignee[]>(
    "/admin/support/assignees",
    { next: { revalidate: 300, tags: [TAGS.adminTeam] } },
    "Couldn't load the support team.",
  );
