import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { OwnerHomeBooking, OwnerHomeBookingQuery } from "./types";

/**
 * `GET /home-service/owner/bookings`: the bookings board (paid visits by
 * default), soonest first, 20 a page. Never cached: experts move these.
 */
export const getOwnerHomeBookings = async (
  q: OwnerHomeBookingQuery = {},
): Promise<HomeListResponse<OwnerHomeBooking[]>> =>
  homeGetList<OwnerHomeBooking[]>(
    `/home-service/owner/bookings${toQuery(q)}`,
    { cache: "no-store" },
    "Couldn't load the home visits. Please try again.",
  );
