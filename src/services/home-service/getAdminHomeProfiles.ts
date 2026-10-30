import { TAGS } from "@/lib/cache-tags";
import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { AdminHomeProfileRow, HomeServiceStatus } from "./types";

/** `GET /admin/home-service/profiles`: branches by status (PENDING_REVIEW, oldest first, by default). */
export const getAdminHomeProfiles = async (
  status?: Exclude<HomeServiceStatus, "DRAFT">,
  page?: number,
): Promise<HomeListResponse<AdminHomeProfileRow[]>> =>
  homeGetList<AdminHomeProfileRow[]>(
    `/admin/home-service/profiles${toQuery({ status, page })}`,
    { next: { revalidate: 30, tags: [TAGS.adminHome] } },
    "Couldn't load the Home Service branches. Please try again.",
  );
