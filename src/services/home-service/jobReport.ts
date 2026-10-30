"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeSend } from "./request";
import type { HomeSafetyReportInput, HomeSafetyReportReceipt } from "./types";

/** `POST /home-service/jobs/:id/report`: the expert reports a problem with a visit. */
export const jobReport = async (
  id: string,
  input: HomeSafetyReportInput,
): Promise<ApiResponse<HomeSafetyReportReceipt>> => {
  const result = await homeSend<HomeSafetyReportReceipt>(
    "post",
    `/home-service/jobs/${enc(id)}/report`,
    input,
    "Couldn't send the report. Please try again.",
    await clientIpHeaders(),
  );
  if (result.success) revalidateTag(TAGS.adminHome, "max");
  return result;
};
