"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { SupportMessage } from "./types";

const touched = (id: string) => {
  updateTag(TAGS.adminTicket(id));
  updateTag(TAGS.adminTickets);
  updateTag(TAGS.adminInbox);
};

/**
 * `POST /admin/support/tickets/:id/messages`: a reply (emailed to the
 * requester) or an internal note (never emailed). A reply whose email failed
 * is still saved; `emailed: false` says so.
 */
export const replyToTicket = async (
  id: string,
  input: { body: string; internal: boolean },
): Promise<ApiResponse<{ message: SupportMessage; emailed: boolean; emailError: string | null }>> => {
  const result = await adminSend<{ message: SupportMessage; emailed: boolean; emailError: string | null }>(
    "post",
    `/admin/support/tickets/${encodeURIComponent(id)}/messages`,
    input,
    "Couldn't send this message. Please try again.",
  );
  if (result.success) touched(id);
  return result;
};
