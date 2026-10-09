import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { AdminBookingDetail } from "./types";

/** `GET /admin/bookings/:id`: the booking, its timeline and its money. */
export const getAdminBooking = (id: string): Promise<ApiResponse<AdminBookingDetail>> =>
  adminGet<AdminBookingDetail>(
    `/admin/bookings/${encodeURIComponent(id)}`,
    { next: { revalidate: 30, tags: [TAGS.adminBooking(id)] } },
    "Couldn't load this booking. Please try again.",
  );
