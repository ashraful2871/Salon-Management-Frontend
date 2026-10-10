import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { SystemStorage } from "./types";

/** `GET /admin/system/storage`: database size against the plan's cap. */
export const getSystemStorage = (): Promise<ApiResponse<SystemStorage>> =>
  adminGet<SystemStorage>(
    "/admin/system/storage",
    { next: { revalidate: 300, tags: [TAGS.adminSystem] } },
    "Couldn't load storage.",
  );
