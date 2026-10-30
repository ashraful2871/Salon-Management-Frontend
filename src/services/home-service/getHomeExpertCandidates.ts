import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeGet, toQuery } from "./request";
import type { HomeExpertCandidate } from "./types";

/** `GET /home-service/owner/experts/candidates?salonId`: active staff who aren't home experts yet. */
export const getHomeExpertCandidates = async (salonId: string): Promise<ApiResponse<HomeExpertCandidate[]>> =>
  homeGet<HomeExpertCandidate[]>(
    `/home-service/owner/experts/candidates${toQuery({ salonId })}`,
    { next: { revalidate: 30, tags: [TAGS.ownerHomeService(salonId), TAGS.staff(salonId)] } },
    "Couldn't load your staff. Please try again.",
  );
