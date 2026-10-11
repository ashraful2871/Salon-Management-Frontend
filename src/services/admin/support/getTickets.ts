import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminTicketFilters, AdminTicketRow } from "./types";

/** `GET /admin/support/tickets`: one page of tickets, status counts in `meta`. */
export const getTickets = (filters: AdminTicketFilters): Promise<ApiResponse<AdminTicketRow[]>> =>
  adminGet<AdminTicketRow[]>(
    `/admin/support/tickets${toQuery({ ...filters, limit: 30 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminTickets] } },
    "Couldn't load tickets. Please try again.",
  );
