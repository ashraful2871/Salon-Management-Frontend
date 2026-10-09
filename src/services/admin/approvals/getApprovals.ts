import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminApprovals, ApprovalStatus } from "./types";

/** `GET /admin/approvals?status`: what the caller could decide, plus their own requests. */
export const getApprovals = (
  status: ApprovalStatus | "ALL" = "PENDING",
): Promise<ApiResponse<AdminApprovals>> =>
  adminGet<AdminApprovals>(
    `/admin/approvals${toQuery({ status })}`,
    { next: { revalidate: 15, tags: [TAGS.adminApprovals] } },
    "Couldn't load the approvals. Please try again.",
  );
