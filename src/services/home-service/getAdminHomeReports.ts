import { TAGS } from "@/lib/cache-tags";
import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { AdminHomeReport, HomeReportStatus } from "./types";

/** `GET /admin/home-service/reports`: open + reviewing (oldest first) by default; `meta.statusCounts` per status. */
export const getAdminHomeReports = async (
  status?: HomeReportStatus,
  page?: number,
): Promise<HomeListResponse<AdminHomeReport[]>> =>
  homeGetList<AdminHomeReport[]>(
    `/admin/home-service/reports${toQuery({ status, page })}`,
    { next: { revalidate: 30, tags: [TAGS.adminHome] } },
    "Couldn't load the safety reports. Please try again.",
  );
