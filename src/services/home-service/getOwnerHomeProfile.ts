import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeGet, toQuery } from "./request";
import type { OwnerHomeProfile } from "./types";

/** `GET /home-service/owner/profile?salonId`: the branch's profile (or the default), checklist, caps and policy. */
export const getOwnerHomeProfile = async (salonId: string): Promise<ApiResponse<OwnerHomeProfile>> =>
  homeGet<OwnerHomeProfile>(
    `/home-service/owner/profile${toQuery({ salonId })}`,
    { next: { revalidate: 30, tags: [TAGS.ownerHomeService(salonId)] } },
    "Couldn't load Home Service for this branch. Please try again.",
  );
