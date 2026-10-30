import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeGet, toQuery } from "./request";
import type { OwnerHomeExpert } from "./types";

/** `GET /home-service/owner/experts?salonId`: the branch's home experts with their verification and linked services. */
export const getOwnerHomeExperts = async (salonId: string): Promise<ApiResponse<OwnerHomeExpert[]>> =>
  homeGet<OwnerHomeExpert[]>(
    `/home-service/owner/experts${toQuery({ salonId })}`,
    { next: { revalidate: 30, tags: [TAGS.ownerHomeService(salonId)] } },
    "Couldn't load the experts. Please try again.",
  );
