import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { serverFetch } from "@/lib/server-fetch";
import { toQuery } from "../request";
import type { AnalyticsQuery, AnalyticsReport, AnalyticsReportName } from "./types";

/**
 * `GET /admin/analytics/:report`, cached 5 min under `TAGS.adminAnalytics`.
 * `fetchedAt` comes from the cached response's `Date` header, so "Updated
 * n min ago" tells the age of the figures, not of this render.
 */
export const getAnalyticsReport = async (
  report: AnalyticsReportName,
  q: AnalyticsQuery,
): Promise<ApiResponse<AnalyticsReport>> => {
  const path = `/admin/analytics/${report}${toQuery({ ...q, includeTest: q.includeTest || undefined })}`;
  try {
    const response = await serverFetch.get(path, {
      next: { revalidate: 300, tags: [TAGS.adminAnalytics] },
    });
    const body = (await response.json()) as ApiResponse<AnalyticsReport>;
    const date = response.headers.get("date");
    if (body.success && body.data && date) body.data.fetchedAt = new Date(date).toISOString();
    return body;
  } catch (error) {
    console.error(`GET ${path} error:`, error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load these figures. Please try again.",
    };
  }
};
