import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { OwnerReport, OwnerReportName } from "./report-types";

export type ReportQuery = { salonId?: string; from: string; to: string; compare: boolean };

/** `GET /owner/reports/:report` (reports.view scope; `money` is owner-only). Cached 5 min. */
export const getOwnerReport = async <R extends OwnerReportName>(
  report: R,
  q: ReportQuery,
): Promise<ApiResponse<OwnerReport<R>>> => {
  try {
    const params = new URLSearchParams({ from: q.from, to: q.to });
    if (q.salonId) params.set("salonId", q.salonId);
    if (q.compare) params.set("compare", "1");
    const response = await serverFetch.get(`/owner/reports/${report}?${params}`, {
      next: { revalidate: 300, tags: [TAGS.ownerReports] },
    });
    return (await response.json()) as ApiResponse<OwnerReport<R>>;
  } catch (error) {
    console.error("getOwnerReport error:", error);
    return {
      success: false,
      message: process.env.NODE_ENV === "development" ? (error as Error).message : "Couldn't load this report.",
    };
  }
};
