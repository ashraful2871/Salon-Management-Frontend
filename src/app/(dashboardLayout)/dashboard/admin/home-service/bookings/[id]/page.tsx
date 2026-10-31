import type { Metadata } from "next";
import { HomeBookingDetail } from "@/components/Admin/home-service/HomeBookingDetail";
import { ErrorState } from "@/components/Shared/ErrorState";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminHomeBooking } from "@/services/home-service/getAdminHomeBooking";

export const metadata: Metadata = { title: "Home visit | Admin" };

export default async function HomeBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [booking, me] = await Promise.all([getAdminHomeBooking(id), getAdminMe()]);

  if (!booking.success || !booking.data) {
    return <ErrorState title="Couldn't load this visit" message={booking.message} />;
  }
  return <HomeBookingDetail booking={booking.data} permissions={me.data?.permissions ?? []} />;
}
