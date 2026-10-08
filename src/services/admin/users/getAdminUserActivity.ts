import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminActivityRow } from "./types";

/** `GET /admin/users/:id/activity`: audit rows about the account or written by it. */
export const getAdminUserActivity = (id: string, page = 1): Promise<ApiResponse<AdminActivityRow[]>> =>
  adminGet<AdminActivityRow[]>(
    `/admin/users/${encodeURIComponent(id)}/activity${toQuery({ page, limit: 50 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminUser(id)] } },
    "Couldn't load activity.",
  );
