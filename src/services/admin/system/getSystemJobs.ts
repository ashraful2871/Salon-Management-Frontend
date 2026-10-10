import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { SystemJobs } from "./types";

/** `GET /admin/system/jobs`: every timer job with its last run. */
export const getSystemJobs = (): Promise<ApiResponse<SystemJobs>> =>
  adminGet<SystemJobs>(
    "/admin/system/jobs",
    { next: { revalidate: 15, tags: [TAGS.adminSystem] } },
    "Couldn't load the background jobs.",
  );
