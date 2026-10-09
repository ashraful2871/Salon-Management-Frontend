import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminReviewFilters, AdminReviewRow } from "./types";

/** `GET /admin/reviews`: one page of a moderation tab, tab counts in `meta`. */
export const getAdminReviews = (filters: AdminReviewFilters): Promise<ApiResponse<AdminReviewRow[]>> =>
  adminGet<AdminReviewRow[]>(
    `/admin/reviews${toQuery({ ...filters, limit: 25 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminReviews] } },
    "Couldn't load reviews. Please try again.",
  );
