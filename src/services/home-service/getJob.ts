import type { ApiResponse } from "@/lib/api-types";
import { enc, homeGet } from "./request";
import type { HomeJob } from "./types";

/** `GET /home-service/jobs/:id`: one of the expert's own visits (else 404). */
export const getJob = async (id: string): Promise<ApiResponse<HomeJob>> =>
  homeGet<HomeJob>(`/home-service/jobs/${enc(id)}`, { cache: "no-store" }, "Couldn't load this job. Please try again.");
