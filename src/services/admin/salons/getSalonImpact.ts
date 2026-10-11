"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { SalonImpact } from "./types";

/** `GET /admin/salons/:id/impact`: what a suspension would touch. Read when the dialog opens. */
export const getSalonImpact = async (id: string): Promise<ApiResponse<SalonImpact>> =>
  adminGet<SalonImpact>(
    `/admin/salons/${encodeURIComponent(id)}/impact`,
    { cache: "no-store" },
    "Couldn't work out the impact.",
  );
