import type { Metadata } from "next";
import { getAdminBookings } from "@/services/admin/bookings/getAdminBookings";
import type { AdminBookingFilters } from "@/services/admin/bookings/types";
import { BookingsClient } from "./BookingsClient";

export const metadata: Metadata = {
  title: "Bookings | Admin",
  description: "Find any booking on SalonKhuji",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** The URL is the state; every filter is a search param. */
export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters: AdminBookingFilters = {
    q: one(sp.q),
    status: one(sp.status),
    salonId: one(sp.salonId),
    area: one(sp.area),
    from: one(sp.from),
    to: one(sp.to),
    dateField: one(sp.dateField),
    channel: one(sp.channel),
    source: one(sp.source),
    depositStatus: one(sp.depositStatus),
    appealStatus: one(sp.appealStatus),
    includeTest: one(sp.includeTest),
    sort: one(sp.sort),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const response = await getAdminBookings(filters);

  return <BookingsClient response={response} filters={filters} />;
}
