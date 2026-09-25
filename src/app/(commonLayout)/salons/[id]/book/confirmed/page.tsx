import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import BookingConfirmed from "@/components/Salons/BookingConfirmed";
import { Button } from "@/components/ui/button";
import { getAppointmentById } from "@/services/appoinments/getAppointmentById";
import { getUserRoles } from "@/services/get-roles/getUserRoles";

export const metadata = {
  title: "Booking confirmed | SalonKhuji",
};

export const dynamic = "force-dynamic";

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const BookingConfirmedPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const { id } = await params;
  const ref = one((await searchParams).ref);

  const role = await getUserRoles();
  if (!role) {
    redirect(`/login?redirect=${encodeURIComponent(`/salons/${id}/book/confirmed`)}`);
  }

  const res = ref ? await getAppointmentById(ref) : null;
  const booking = res?.success ? res.data : undefined;

  // The booking itself succeeded — the only thing that can fail here is reading
  // it back, so never imply the appointment did not happen.
  if (!booking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage/15">
            <CheckCircle2 className="h-8 w-8 text-sage" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Your appointment is booked</h1>
          <p className="mb-8 text-muted-foreground">
            We could not load the receipt on this page, but the booking went
            through and the confirmation is in your email. You will find it under
            your bookings.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/appointments">View my bookings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/salons/${id}`}>Back to the salon</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BookingConfirmed
      booking={{
        id: booking.id,
        salonId: booking.salon?.id || id,
        salonName: booking.salon?.name || "the salon",
        salonAddress: booking.salon?.address,
        salonPhone: booking.salon?.phone,
        serviceName: booking.service?.name || "Service",
        serviceDuration: booking.service?.duration,
        staffName: booking.staff?.user?.name,
        counterName: booking.counter?.name,
        date: booking.appointmentDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        totalMinor: booking.totalMinor ?? 0,
        depositMinor: booking.depositMinor ?? 0,
        amountDueMinor: booking.amountDueMinor,
        serialNumber: booking.serialNumber,
        token: booking.token,
      }}
    />
  );
};

export default BookingConfirmedPage;
