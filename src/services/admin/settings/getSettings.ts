import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminSettings } from "./types";

/** `GET /admin/settings` (settings.view): every setting by group + env-only names. */
export const getSettings = (): Promise<ApiResponse<AdminSettings>> =>
  adminGet<AdminSettings>(
    "/admin/settings",
    { next: { revalidate: 30, tags: [TAGS.adminSettings] } },
    "Couldn't load the settings. Please try again.",
  );
