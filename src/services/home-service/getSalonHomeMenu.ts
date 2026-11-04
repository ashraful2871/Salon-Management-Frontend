"use server";

import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeGet, toQuery } from "./request";
import type { HomeAudience, HomeSalonMenu } from "./types";

/**
 * `GET /home-service/salons/:salonId/menu`: what this branch does at home for
 * `audience`, who does each service, and the advance share. Read fresh (it is
 * opened on demand from the salon page and the chat), so a service the owner
 * just switched off is never offered. A branch that can't be booked at home
 * answers `HOME_SERVICE_UNAVAILABLE`.
 */
export const getSalonHomeMenu = async (
  salonId: string,
  audience: HomeAudience,
  point?: { lat: number; lng: number } | null,
): Promise<ApiResponse<HomeSalonMenu>> =>
  homeGet<HomeSalonMenu>(
    `/home-service/salons/${enc(salonId)}/menu${toQuery({ audience, lat: point?.lat, lng: point?.lng })}`,
    { cache: "no-store", headers: await clientIpHeaders() },
    "Couldn't load the home services. Please try again.",
  );
