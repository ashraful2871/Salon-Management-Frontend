import type { Metadata } from "next";
import { HomeBookingsClient } from "@/components/Admin/home-service/HomeBookingsClient";
import { getAdminHomeBookings } from "@/services/home-service/getAdminHomeBookings";
import type { AdminHomeBookingQuery, HomeAudience, HomeBookingStatus } from "@/services/home-service/types";

export const metadata: Metadata = {
  title: "Home bookings | Admin",
  description: "Find any home visit",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** The URL is the state; every filter is a search param. */
export default async function HomeBookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters: AdminHomeBookingQuery = {
    q: one(sp.q),
    status: one(sp.status) as HomeBookingStatus | undefined,
    audience: one(sp.audience) as HomeAudience | undefined,
    salonId: one(sp.salonId),
    from: one(sp.from),
    to: one(sp.to),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  return <HomeBookingsClient response={await getAdminHomeBookings(filters)} filters={filters} />;
}
