import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminContent } from "./types";

/**
 * `GET /admin/content` (content.manage): the content.* settings and each
 * featured salon's live status. Saves go through `updateSetting`, which
 * expires `TAGS.adminSettings` and revalidates the public settings.
 */
export const getContent = (): Promise<ApiResponse<AdminContent>> =>
  adminGet<AdminContent>(
    "/admin/content",
    { next: { revalidate: 30, tags: [TAGS.adminSettings] } },
    "Couldn't load the site content. Please try again.",
  );
