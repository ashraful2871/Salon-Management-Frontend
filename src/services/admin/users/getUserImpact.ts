"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { UserImpact } from "./types";

/** `GET /admin/users/:id/impact`: what a suspend or block would also touch. Read when the dialog opens. */
export const getUserImpact = async (id: string): Promise<ApiResponse<UserImpact>> =>
  adminGet<UserImpact>(
    `/admin/users/${encodeURIComponent(id)}/impact`,
    { cache: "no-store" },
    "Couldn't work out the impact.",
  );
