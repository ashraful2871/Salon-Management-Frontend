import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeGetList, toQuery, type HomeListResponse } from "./request";
import type { HomeReview } from "./types";

/** `GET /home-service/experts/:id/reviews?page`: published reviews, newest first. */
export const getHomeExpertReviews = async (id: string, page = 1): Promise<HomeListResponse<HomeReview[]>> =>
  homeGetList<HomeReview[]>(
    `/home-service/experts/${enc(id)}/reviews${toQuery({ page })}`,
    { next: { revalidate: 120, tags: [TAGS.homeExpert(id)] }, headers: await clientIpHeaders() },
    "Couldn't load the reviews. Please try again.",
  );
