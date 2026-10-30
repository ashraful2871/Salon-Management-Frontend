"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc, homeGet } from "./request";
import type { HomeReassignCandidate } from "./types";

/** `GET /home-service/owner/bookings/:id/eligible-experts`: same side, every service, free at that time. */
export const getHomeReassignCandidates = async (id: string): Promise<ApiResponse<HomeReassignCandidate[]>> =>
  homeGet<HomeReassignCandidate[]>(
    `/home-service/owner/bookings/${enc(id)}/eligible-experts`,
    { cache: "no-store" },
    "Couldn't load the free experts. Please try again.",
  );
