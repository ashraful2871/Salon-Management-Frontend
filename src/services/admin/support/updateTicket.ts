"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { AdminTicketRow, TicketPriority, TicketStatus } from "./types";

const touched = (id: string) => {
  updateTag(TAGS.adminTicket(id));
  updateTag(TAGS.adminTickets);
  updateTag(TAGS.adminInbox);
};

/** `PATCH /admin/support/tickets/:id`: status, assignee, priority or category. */
export const updateTicket = async (
  id: string,
  input: { status?: TicketStatus; assigneeId?: string | null; priority?: TicketPriority; category?: string },
): Promise<ApiResponse<AdminTicketRow>> => {
  const result = await adminSend<AdminTicketRow>(
    "patch",
    `/admin/support/tickets/${encodeURIComponent(id)}`,
    input,
    "Couldn't update this ticket. Please try again.",
  );
  if (result.success) touched(id);
  return result;
};
