"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeSend } from "./request";
import type { HomeSafetyReportInput, HomeSafetyReportReceipt } from "./types";

/** `POST /home-service/bookings/:id/report`: a safety or quality report on the customer's own visit. */
export const reportHomeBooking = async (
  id: string,
  input: HomeSafetyReportInput,
): Promise<ApiResponse<HomeSafetyReportReceipt>> => {
  const result = await homeSend<HomeSafetyReportReceipt>(
    "post",
    `/home-service/bookings/${enc(id)}/report`,
    input,
    "Couldn't send the report. Please try again.",
    await clientIpHeaders(),
  );
  if (result.success) {
    revalidateTag(TAGS.adminHome, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
