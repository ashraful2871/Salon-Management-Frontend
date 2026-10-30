import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeGet, toQuery } from "./request";
import type { HomeAudience, HomeOffering } from "./types";

/** `GET /home-service/owner/offerings?salonId&audience`: the branch's Ladies / Gents home menu. */
export const getHomeOfferings = async (
  salonId: string,
  audience?: HomeAudience,
): Promise<ApiResponse<HomeOffering[]>> =>
  homeGet<HomeOffering[]>(
    `/home-service/owner/offerings${toQuery({ salonId, audience })}`,
    { next: { revalidate: 30, tags: [TAGS.ownerHomeService(salonId)] } },
    "Couldn't load the home menu. Please try again.",
  );
