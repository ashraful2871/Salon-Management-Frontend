"use server";

import type { ApiResponse } from "@/lib/api-types";
import { homeGet, toQuery } from "./request";
import type { HomeJobList } from "./types";

/** `GET /home-service/jobs?date`: the expert's paid visits, today … +7 days, or one day. Never cached. */
export const getMyJobs = async (date?: string): Promise<ApiResponse<HomeJobList>> =>
  homeGet<HomeJobList>(
    `/home-service/jobs${toQuery({ date })}`,
    { cache: "no-store" },
    "Couldn't load your jobs. Please try again.",
  );
