import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeGet, toQuery } from "./request";
import type { HomeExpertDetail } from "./types";

/**
 * `GET /home-service/experts/:id`: profile, menu, policy and the first page of
 * reviews. With a point, also `distanceKm` and whether the branch reaches it.
 * An expert who can't be booked answers `EXPERT_UNAVAILABLE`.
 */
export const getHomeExpert = async (
  id: string,
  q: { lat?: number; lng?: number; reviewPage?: number } = {},
): Promise<ApiResponse<HomeExpertDetail>> =>
  homeGet<HomeExpertDetail>(
    `/home-service/experts/${enc(id)}${toQuery(q)}`,
    { next: { revalidate: 120, tags: [TAGS.homeExpert(id)] }, headers: await clientIpHeaders() },
    "Couldn't load this expert. Please try again.",
  );
