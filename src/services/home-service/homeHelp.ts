"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";
import type { HomeHelpResult } from "./types";

/**
 * `POST /home-service/bookings/:id/help` during a visit: an URGENT support
 * ticket (the same one again within 15 minutes) and the phone to call now.
 */
export const homeHelp = async (id: string): Promise<ApiResponse<HomeHelpResult>> => {
  const result = await homeSend<HomeHelpResult>(
    "post",
    `/home-service/bookings/${enc(id)}/help`,
    undefined,
    "Couldn't reach support. Please call us.",
  );
  if (result.success) {
    revalidateTag(TAGS.adminHome, "max");
    revalidateTag(TAGS.adminTickets, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
