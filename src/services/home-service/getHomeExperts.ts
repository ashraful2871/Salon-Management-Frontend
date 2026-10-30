import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { HomeExpertList, HomeExpertQuery } from "./types";

/** `GET /home-service/experts`: verified experts whose branch reaches this point, 20 a page. */
export const getHomeExperts = async (q: HomeExpertQuery): Promise<HomeListResponse<HomeExpertList>> =>
  homeGetList<HomeExpertList>(
    `/home-service/experts${toQuery(q)}`,
    { next: { revalidate: 60, tags: [TAGS.homeCatalog] }, headers: await clientIpHeaders() },
    "Couldn't load the experts. Please try again.",
  );
