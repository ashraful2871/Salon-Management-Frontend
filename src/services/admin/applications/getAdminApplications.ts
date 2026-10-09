import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminApplication, AdminApplicationFilters } from "./types";

/** `GET /become-salon-owner/applications`: one page of owner applications, status counts in `meta`. */
export const getAdminApplications = (
  filters: AdminApplicationFilters,
): Promise<ApiResponse<AdminApplication[]>> =>
  adminGet<AdminApplication[]>(
    `/become-salon-owner/applications${toQuery({ ...filters, limit: 25 })}`,
    { next: { revalidate: 30, tags: [TAGS.salonApplications] } },
    "Couldn't load applications. Please try again.",
  );
