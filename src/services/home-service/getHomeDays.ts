"use server";

import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeGet, toQuery } from "./request";
import type { HomeAvailabilityQuery, HomeDays } from "./types";

/** `GET /home-service/availability/days`: the booking window's day chips, each with `hasSlots`. Never cached. */
export const getHomeDays = async (q: HomeAvailabilityQuery): Promise<ApiResponse<HomeDays>> =>
  homeGet<HomeDays>(
    `/home-service/availability/days${toQuery(q)}`,
    { cache: "no-store", headers: await clientIpHeaders() },
    "Couldn't load the days. Please try again.",
  );
