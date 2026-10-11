import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AiIndexStatus } from "./types";

/** `GET /ai/status` (system.view): AI search index coverage. */
export const getAiIndexStatus = (): Promise<ApiResponse<AiIndexStatus>> =>
  adminGet<AiIndexStatus>(
    "/ai/status",
    { next: { revalidate: 60, tags: [TAGS.adminSystem] } },
    "Couldn't load the AI index status.",
  );
