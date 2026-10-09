import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminBookingFilters, AdminBookingRow } from "./types";

/** `GET /admin/bookings`: one page of bookings, status counts in `meta`. */
export const getAdminBookings = (filters: AdminBookingFilters): Promise<ApiResponse<AdminBookingRow[]>> =>
  adminGet<AdminBookingRow[]>(
    `/admin/bookings${toQuery({ ...filters, limit: 25 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminBookings] } },
    "Couldn't load bookings. Please try again.",
  );
