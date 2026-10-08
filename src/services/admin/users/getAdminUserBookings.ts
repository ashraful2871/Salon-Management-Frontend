import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminUserBooking } from "./types";

/** `GET /admin/users/:id/bookings`: the account's bookings as a customer, newest first. */
export const getAdminUserBookings = (
  id: string,
  page = 1,
): Promise<ApiResponse<AdminUserBooking[]>> =>
  adminGet<AdminUserBooking[]>(
    `/admin/users/${encodeURIComponent(id)}/bookings${toQuery({ page, limit: 50 })}`,
    { next: { revalidate: 30, tags: [TAGS.adminUser(id)] } },
    "Couldn't load bookings.",
  );
