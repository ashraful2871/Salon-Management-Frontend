"use server";

import { updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";

/** `DELETE /home-service/addresses/:id`. Bookings keep their own copy of the address. */
export const deleteHomeAddress = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  const result = await homeSend<{ id: string }>(
    "delete",
    `/home-service/addresses/${enc(id)}`,
    undefined,
    "Couldn't remove the address. Please try again.",
  );
  if (result.success) updateTag(TAGS.homeAddresses);
  return result;
};
