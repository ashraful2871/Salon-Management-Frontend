import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminAppealRow } from "../bookings/types";

/** `GET /admin/appeals`: every appeal awaiting a decision, oldest first. */
export const getAdminAppeals = (): Promise<ApiResponse<AdminAppealRow[]>> =>
  adminGet<AdminAppealRow[]>(
    "/admin/appeals",
    { next: { revalidate: 30, tags: [TAGS.adminAppeals] } },
    "Couldn't load the appeals. Please try again.",
  );
