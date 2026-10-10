import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { SystemIntegrations } from "./types";

/** `GET /admin/system/integrations`: email, payments, Gemini, try-on, version. */
export const getSystemIntegrations = (): Promise<ApiResponse<SystemIntegrations>> =>
  adminGet<SystemIntegrations>(
    "/admin/system/integrations",
    { next: { revalidate: 30, tags: [TAGS.adminSystem] } },
    "Couldn't load the integrations.",
  );
