"use server";

import type { ApiResponse } from "@/lib/api-types";
import { getAdminReferral } from "./getAdminReferral";
import type { AdminReferralDetail } from "./types";

/** `getAdminReferral` as a Server Action, for the list's detail sheet (opened on click, never prefetched). */
export const loadAdminReferral = async (id: string): Promise<ApiResponse<AdminReferralDetail>> => getAdminReferral(id);
