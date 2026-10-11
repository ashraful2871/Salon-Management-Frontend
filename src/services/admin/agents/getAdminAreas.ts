import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AreaOption } from "./types";

/** `GET /admin/areas`: every place that has a salon, so an agent's area is picked, not typed. */
export const getAdminAreas = (): Promise<ApiResponse<AreaOption[]>> =>
  adminGet<AreaOption[]>(
    "/admin/areas",
    { next: { revalidate: 3600, tags: [TAGS.adminAreas] } },
    "Couldn't load areas.",
  );
