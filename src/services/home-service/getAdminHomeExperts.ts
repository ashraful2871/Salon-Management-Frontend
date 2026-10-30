import { TAGS } from "@/lib/cache-tags";
import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { AdminHomeExpertRow, ExpertVerification } from "./types";

/** `GET /admin/home-service/experts`: the verification queue (PENDING, oldest submission first, by default). */
export const getAdminHomeExperts = async (
  verification?: ExpertVerification,
  page?: number,
): Promise<HomeListResponse<AdminHomeExpertRow[]>> =>
  homeGetList<AdminHomeExpertRow[]>(
    `/admin/home-service/experts${toQuery({ verification, page })}`,
    { next: { revalidate: 30, tags: [TAGS.adminHome] } },
    "Couldn't load the experts. Please try again.",
  );
