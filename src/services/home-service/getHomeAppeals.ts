import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeGet } from "./request";
import type { AdminHomeAppeal } from "./types";

/** `GET /admin/appeals?kind=HOME`: home visits whose kept fee is contested, oldest first. */
export const getHomeAppeals = async (): Promise<ApiResponse<AdminHomeAppeal[]>> =>
  homeGet<AdminHomeAppeal[]>(
    "/admin/appeals?kind=HOME",
    { next: { revalidate: 30, tags: [TAGS.adminAppeals, TAGS.adminHome] } },
    "Couldn't load the appeals. Please try again.",
  );
