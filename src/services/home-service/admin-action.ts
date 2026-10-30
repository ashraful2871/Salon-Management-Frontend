import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeSend } from "./request";

/**
 * A back-office write under `/admin/home-service/*` (tier 3: answers
 * `STEP_UP_REQUIRED` without a fresh code), from inside a server action. The
 * queue is on screen; the branch's owner page and the public lists follow.
 */
export const adminHomeAction = async <T>(
  path: string,
  body: unknown,
  fallback: string,
  method: "post" | "patch" = "post",
): Promise<ApiResponse<T>> => {
  const result = await homeSend<T>(method, `/admin/home-service${path}`, body, fallback);
  if (result.success) {
    updateTag(TAGS.adminHome);
    updateTag(TAGS.adminInbox);
    revalidateTag(TAGS.homeCatalog, "max");
    const salonId = (result.data as { salonId?: string } | undefined)?.salonId;
    if (salonId) revalidateTag(TAGS.ownerHomeService(salonId), "max");
  }
  return result;
};
