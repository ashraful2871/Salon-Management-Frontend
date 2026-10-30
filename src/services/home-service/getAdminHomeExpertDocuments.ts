"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc, homeGet } from "./request";
import type { AdminHomeExpertDocuments } from "./types";

/**
 * `GET /admin/home-service/experts/:id/documents`: audited on every call, with
 * links that expire in 5 minutes. A server action (not a page read) so each
 * view is a deliberate click; tier 3, so it may answer `STEP_UP_REQUIRED`.
 */
export const getAdminHomeExpertDocuments = async (id: string): Promise<ApiResponse<AdminHomeExpertDocuments>> =>
  homeGet<AdminHomeExpertDocuments>(
    `/admin/home-service/experts/${enc(id)}/documents`,
    { cache: "no-store" },
    "Couldn't open the documents. Please try again.",
  );
