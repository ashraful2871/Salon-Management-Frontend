import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminTeam } from "./types";

/** `GET /admin/team` (team.manage): admins and pending admin invitations. */
export const getAdminTeam = (): Promise<ApiResponse<AdminTeam>> =>
  adminGet<AdminTeam>(
    "/admin/team",
    { next: { revalidate: 30, tags: [TAGS.adminTeam] } },
    "Couldn't load the team. Please try again.",
  );
