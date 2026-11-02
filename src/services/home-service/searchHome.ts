"use server";

import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeGet, toQuery } from "./request";
import type { HomeAudience, HomeSearchSuggestions } from "./types";

/**
 * `GET /home-service/search`: as-you-type suggestions (services and experts)
 * for the search box on the Ladies / Gents lists. A Server Action, so the box
 * can call it; cached 60 s per point + query like the lists it leads to.
 */
export const searchHome = async (q: {
  audience: HomeAudience;
  lat: number;
  lng: number;
  q: string;
}): Promise<ApiResponse<HomeSearchSuggestions>> =>
  homeGet<HomeSearchSuggestions>(
    `/home-service/search${toQuery({ ...q, q: q.q.trim().toLowerCase().slice(0, 60) })}`,
    { next: { revalidate: 60, tags: [TAGS.homeCatalog] }, headers: await clientIpHeaders() },
    "Search is unavailable right now.",
  );
