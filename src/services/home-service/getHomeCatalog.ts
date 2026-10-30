import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeGet, toQuery } from "./request";
import type { HomeAudience, HomeCatalog } from "./types";

/** `GET /home-service/catalog`: the services offered at this point, cheapest price per name. */
export const getHomeCatalog = async (q: {
  audience: HomeAudience;
  lat: number;
  lng: number;
}): Promise<ApiResponse<HomeCatalog>> =>
  homeGet<HomeCatalog>(
    `/home-service/catalog${toQuery(q)}`,
    { next: { revalidate: 60, tags: [TAGS.homeCatalog] }, headers: await clientIpHeaders() },
    "Couldn't load home services. Please try again.",
  );
