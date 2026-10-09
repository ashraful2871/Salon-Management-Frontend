import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@/components/Shared/ErrorState";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminBooking } from "@/services/admin/bookings/getAdminBooking";
import { BookingDetailClient } from "./BookingDetailClient";

export const metadata: Metadata = { title: "Booking | Admin" };

/** One booking: what happened to it and to its money. */
export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [booking, me] = await Promise.all([getAdminBooking(id), getAdminMe()]);

  if (!booking.success || !booking.data) {
    return (
      <div className="space-y-4">
        <ErrorState title="Couldn't open this booking" message={booking.message} />
        <Link href="/dashboard/admin/bookings" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <BookingDetailClient
      booking={booking.data}
      permissions={me.data?.permissions ?? []}
      viewerId={me.data?.userId}
    />
  );
}
