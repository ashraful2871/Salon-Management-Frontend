import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { MetricDefinition } from "./types";

/** `GET /admin/analytics/metrics`: the dictionary behind every ⓘ tooltip. */
export const getMetricDefinitions = (): Promise<ApiResponse<MetricDefinition[]>> =>
  adminGet<MetricDefinition[]>(
    "/admin/analytics/metrics",
    { next: { revalidate: 3600, tags: [TAGS.adminAnalytics] } },
    "Couldn't load the metric definitions.",
  );
