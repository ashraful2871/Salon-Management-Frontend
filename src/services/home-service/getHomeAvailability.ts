import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeGet, toQuery } from "./request";
import type { HomeAvailability, HomeAvailabilityQuery } from "./types";

/**
 * `GET /home-service/availability`: open start times on one day (YYYY-MM-DD,
 * Dhaka). Never cached: a slot shown must still be free.
 */
export const getHomeAvailability = async (
  q: HomeAvailabilityQuery & { date: string },
): Promise<ApiResponse<HomeAvailability>> =>
  homeGet<HomeAvailability>(
    `/home-service/availability${toQuery(q)}`,
    { cache: "no-store", headers: await clientIpHeaders() },
    "Couldn't load the times. Please try again.",
  );
