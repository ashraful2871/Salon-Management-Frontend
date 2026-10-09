import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminTicketDetail } from "./types";

/** `GET /admin/support/tickets/:id`: the conversation and its linked user and booking. */
export const getTicket = (id: string): Promise<ApiResponse<AdminTicketDetail>> =>
  adminGet<AdminTicketDetail>(
    `/admin/support/tickets/${encodeURIComponent(id)}`,
    { next: { revalidate: 30, tags: [TAGS.adminTicket(id)] } },
    "Couldn't load this ticket. Please try again.",
  );
