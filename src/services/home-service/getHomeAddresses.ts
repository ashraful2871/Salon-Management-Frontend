import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeGet } from "./request";
import type { HomeAddress } from "./types";

/** `GET /home-service/addresses`: the customer's saved addresses, default first. */
export const getHomeAddresses = async (): Promise<ApiResponse<HomeAddress[]>> =>
  homeGet<HomeAddress[]>(
    "/home-service/addresses",
    { next: { revalidate: 300, tags: [TAGS.homeAddresses] } },
    "Couldn't load your addresses. Please try again.",
  );
