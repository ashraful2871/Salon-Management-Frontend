import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminUserReview } from "./types";

/** `GET /admin/users/:id/reviews`: reviews the account wrote. */
export const getAdminUserReviews = (id: string, page = 1): Promise<ApiResponse<AdminUserReview[]>> =>
  adminGet<AdminUserReview[]>(
    `/admin/users/${encodeURIComponent(id)}/reviews${toQuery({ page, limit: 50 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminUser(id)] } },
    "Couldn't load reviews.",
  );
