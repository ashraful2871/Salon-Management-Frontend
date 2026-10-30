import { TAGS } from "@/lib/cache-tags";
import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { AdminHomeBookingQuery, AdminHomeBookingRow } from "./types";

/** `GET /admin/home-service/bookings`: the explorer over every visit, unpaid ones included, newest start first. */
export const getAdminHomeBookings = async (
  q: AdminHomeBookingQuery = {},
): Promise<HomeListResponse<AdminHomeBookingRow[]>> =>
  homeGetList<AdminHomeBookingRow[]>(
    `/admin/home-service/bookings${toQuery(q)}`,
    { next: { revalidate: 30, tags: [TAGS.adminHome] } },
    "Couldn't load the home visits. Please try again.",
  );
