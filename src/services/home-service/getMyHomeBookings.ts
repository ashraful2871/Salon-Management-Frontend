import { homeGetList, toQuery, type HomeListResponse } from "./request";
import type { HomeBookingSummary, HomeMyBookingsTab } from "./types";

/** `GET /home-service/bookings/me`: upcoming (active, soonest first) or past, 20 a page. */
export const getMyHomeBookings = async (
  tab: HomeMyBookingsTab = "upcoming",
  page = 1,
): Promise<HomeListResponse<HomeBookingSummary[]>> =>
  homeGetList<HomeBookingSummary[]>(
    `/home-service/bookings/me${toQuery({ tab, page })}`,
    // Experts, jobs and the expiry job move these; always read fresh.
    { cache: "no-store" },
    "Couldn't load your home visits. Please try again.",
  );
