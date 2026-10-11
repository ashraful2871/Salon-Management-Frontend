import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminUserFilters, AdminUserRow } from "./types";

/** `GET /admin/users`: one page of accounts, contacts masked, role counts in `meta`. */
export const getAdminUsers = (filters: AdminUserFilters): Promise<ApiResponse<AdminUserRow[]>> =>
  adminGet<AdminUserRow[]>(
    `/admin/users${toQuery({ ...filters, limit: 25 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminUsers] } },
    "Couldn't load users. Please try again.",
  );
