"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { AdminHomeReport, AdminHomeReportStatusInput } from "./types";

/** `POST /admin/home-service/reports/:id/status` with a note; `blockCustomer` also bars the customer from home visits. */
export const setHomeReportStatus = async (
  id: string,
  input: AdminHomeReportStatusInput,
): Promise<ApiResponse<AdminHomeReport>> =>
  adminHomeAction<AdminHomeReport>(`/reports/${enc(id)}/status`, input, "Couldn't update the report. Please try again.");
