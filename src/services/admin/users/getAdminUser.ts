import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminUserDetail } from "./types";

/** `GET /admin/users/:id`: everything User 360 shows above the tabs. */
export const getAdminUser = (id: string): Promise<ApiResponse<AdminUserDetail>> =>
  adminGet<AdminUserDetail>(
    `/admin/users/${encodeURIComponent(id)}`,
    { next: { revalidate: 30, tags: [TAGS.adminUser(id)] } },
    "Couldn't load this user. Please try again.",
  );
