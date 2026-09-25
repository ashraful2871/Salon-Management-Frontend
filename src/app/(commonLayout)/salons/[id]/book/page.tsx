/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import BookingSummary from "@/components/Salons/BookingSummary";
import { Button } from "@/components/ui/button";
import { getSingleSalon } from "@/services/salon/getSingleSalon";
import { getSlots } from "@/services/slots/slot-api";
import { getMyWallet } from "@/services/wallet/getMyWallet";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { resolveDepositMinor } from "@/lib/deposit";

export const metadata = {
  title: "Review your booking | SalonKhuji",
};

// The wallet balance and the slot's availability are both live figures — a
// cached summary would quote money the customer no longer has, or a slot
// someone else just took.
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const InvalidSelection = ({
  salonId,
  title,
  message,
}: {
  salonId: string;
  title: string;
  message: string;
}) => (
  <div className="min-h-[70vh] flex items-center justify-center px-4">
    <div className="max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">{title}</h1>
      <p className="mb-8 text-muted-foreground">{message}</p>
      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link href={`/salons/${salonId}`}>Back to the salon</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/salons">Browse salons</Link>
        </Button>
      </div>
    </div>
  </div>
);

const BookingSummaryPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) => {
  const { id } = await params;
  const query = await searchParams;

  const serviceId = one(query.service);
  const counterId = one(query.counter);
  const slotId = one(query.slot);
  const date = one(query.date);
  const staffId = one(query.staff);
  const notes = one(query.notes) || "";

  // Rebuild the URL we are standing on so login can send the customer straight
  // back to their half-finished booking.
  const selectionQuery = new URLSearchParams();
  if (serviceId) selectionQuery.set("service", serviceId);
  if (counterId) selectionQuery.set("counter", counterId);
  if (slotId) selectionQuery.set("slot", slotId);
  if (date) selectionQuery.set("date", date);
  if (staffId) selectionQuery.set("staff", staffId);
  if (notes) selectionQuery.set("notes", notes);
  const selfHref = `/salons/${id}/book?${selectionQuery.toString()}`;

  const role = await getUserRoles();
  if (!role) {
    redirect(`/login?redirect=${encodeURIComponent(selfHref)}`);
  }

  if (!serviceId || !counterId || !slotId || !date) {
    return (
      <InvalidSelection
        salonId={id}
        title="Your selection is incomplete"
        message="We could not read the service, counter, date or time for this booking. Please pick them again."
      />
    );
  }

  const [salonRes, slotRes, walletRes] = await Promise.all([
    getSingleSalon(id),
    // Deliberately unfiltered by status: we want to know if the slot has been
    // taken since the customer picked it, not just that it vanished. Past times
    // are filtered though - a customer who left this page open should be sent
    // back to pick again rather than reaching the pay button on a dead slot.
    getSlots({ salonId: id, date, upcomingOnly: true }),
    getMyWallet(),
  ]);

  const salon: any = salonRes?.data;

  if (!salonRes?.success || !salon) {
    return (
      <InvalidSelection
        salonId={id}
        title="Salon unavailable"
        message={salonRes?.message || "This salon could not be loaded right now."}
      />
    );
  }

  const service = (salon.services || []).find((s: any) => s.id === serviceId);
  const counter = (salon.counters || []).find((c: any) => c.id === counterId);
  const staff = staffId
    ? (salon.staff || []).find((s: any) => s.id === staffId)
    : undefined;
  const slot = (slotRes?.success ? slotRes.data : []).find(
    (s: any) => s.id === slotId,
  );

  if (!service || !counter || !slot) {
    return (
      <InvalidSelection
        salonId={id}
        title="That selection is no longer valid"
        message="The service, counter or time slot you chose is not available anymore. Please start the booking again."
      />
    );
  }

  // A slot generated for a specific counter can only be booked on that counter —
  // a hand-edited URL must not move the booking to a different chair.
  if (slot.counterId && slot.counterId !== counterId) {
    return (
      <InvalidSelection
        salonId={id}
        title="That time belongs to another counter"
        message={`This time slot is reserved for ${
          slot.counter?.name ?? "a different counter"
        }. Please pick the time again so we book you at the right one.`}
      />
    );
  }

  const priceMinor = service.priceMinor ?? 0;
  const depositMinor = resolveDepositMinor(
    { depositMinor: salon.depositMinor, depositPercent: salon.depositPercent },
    priceMinor,
  );

  const wallet = walletRes?.success ? walletRes.data : undefined;

  return (
    <BookingSummary
      salon={{
        id: salon.id,
        name: salon.name,
        address: salon.address,
        city: salon.city,
        area: salon.area,
        phone: salon.phone,
        image: Array.isArray(salon.images) ? salon.images[0] : undefined,
        rating: salon.rating,
        totalReviews: salon.totalReviews,
        cancellationWindowMin: salon.cancellationWindowMin ?? 120,
      }}
      service={{
        id: service.id,
        name: service.name,
        category: service.category,
        duration: service.duration,
        priceMinor,
      }}
      counter={{ id: counter.id, name: counter.name, code: counter.code }}
      staff={
        staff
          ? {
              id: staff.id,
              name: staff.user?.name || "Specialist",
              speciality: staff.speciality,
            }
          : undefined
      }
      slot={{
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isTaken: slot.isBooked === true || slot.status !== "AVAILABLE",
      }}
      notes={notes}
      depositMinor={depositMinor}
      wallet={{
        available: wallet?.availableMinor ?? 0,
        balance: wallet?.balanceMinor ?? 0,
        held: wallet?.heldBalanceMinor ?? 0,
        isFrozen: wallet?.isFrozen ?? false,
        loaded: Boolean(wallet),
      }}
      editHref={`/salons/${id}`}
    />
  );
};

export default BookingSummaryPage;
