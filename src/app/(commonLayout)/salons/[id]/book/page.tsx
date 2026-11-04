/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import BookingSummary from "@/components/Salons/BookingSummary";
import SalonBookingFlow from "@/components/Salons/booking/SalonBookingFlow";
import CustomerOnlyNotice from "@/components/Salons/CustomerOnlyNotice";
import { bookingHref, toSalonView } from "@/components/Salons/salon-view";
import { dhakaToday } from "@/components/Salons/salon-time";
import { Button } from "@/components/ui/button";
import { getSingleSalon } from "@/services/salon/getSingleSalon";
import { getSlots } from "@/services/slots/slot-api";
import { getMyWallet } from "@/services/wallet/getMyWallet";
import { getPublicSettings } from "@/services/settings/getPublicSettings";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { bookingPaymentsEnabled, resolveDepositMinor } from "@/lib/deposit";
import type { ProviderId } from "@/lib/payment-providers";

const isProviderId = (value: string | undefined): value is ProviderId =>
  value === "BKASH" || value === "SSLCOMMERZ";

export const metadata = {
  title: "Book an appointment",
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
  retryHref,
}: {
  salonId: string;
  title: string;
  message: string;
  /** Where "Choose again" goes; without it the main action is the salon page. */
  retryHref?: string;
}) => (
  <div className="flex min-h-[70vh] items-center justify-center bg-surface-subtle px-4 py-16">
    <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-warning-soft text-warning">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h1 className="font-display text-title text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        {retryHref ? (
          <>
            <Button asChild>
              <Link href={retryHref}>Choose again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/salons/${salonId}`}>Back to the salon</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href={`/salons/${salonId}`}>Back to the salon</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/salons">Browse salons</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  </div>
);

/**
 * `/salons/:id/book` is the whole salon booking:
 * - without `slot`: choosing the service, specialist, date and time
 *   (`SalonBookingFlow`), open to visitors;
 * - with `service`, `counter`, `slot` and `date`: the review & confirm page,
 *   which needs a signed-in customer.
 */
const BookingPage = async ({
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
  // Set by the payment result's "Try again": reopen the top-up here.
  const topupMethod = one(query.method);

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
  // Back into the choosing step with everything but the time kept.
  const chooseHref = bookingHref(id, {
    service: serviceId,
    staff: staffId,
    date,
    notes: notes || undefined,
    step: serviceId ? "time" : undefined,
  });

  const role = await getUserRoles();

  // Owners, staff, admins and agents cannot book (the API refuses them with
  // CUSTOMER_ONLY); say so before they fill anything in.
  if (role && role !== "CUSTOMER") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <CustomerOnlyNotice
          role={role}
          returnTo={selfHref}
          secondary={
            <Button variant="outline" asChild>
              <Link href={`/salons/${id}`}>Back to the salon</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // ---------------------------------------------------------- choosing
  if (!slotId) {
    const [salonRes, settingsRes] = await Promise.all([getSingleSalon(id), getPublicSettings()]);
    const raw: any = salonRes?.data;
    if (!salonRes?.success || !raw) {
      return (
        <InvalidSelection
          salonId={id}
          title="Salon unavailable"
          message={salonRes?.message || "This salon could not be loaded right now."}
        />
      );
    }
    const salon = toSalonView(raw);
    if (salon.bookingPaused) {
      return (
        <InvalidSelection
          salonId={id}
          title="Online booking is paused"
          message={`${salon.name} isn't taking online bookings right now. Walk-ins are welcome.`}
        />
      );
    }
    if (salon.services.length === 0 && !salon.homeService) {
      return (
        <InvalidSelection
          salonId={id}
          title="Nothing to book yet"
          message={`${salon.name} hasn't listed any services for online booking yet.`}
        />
      );
    }
    const takesDeposit =
      bookingPaymentsEnabled(settingsRes.success ? settingsRes.data : null) &&
      ((raw.depositMinor ?? 0) > 0 || (raw.depositPercent ?? 0) > 0);

    return (
      <SalonBookingFlow
        salon={salon}
        today={dhakaToday()}
        takesDeposit={takesDeposit}
        signedIn={Boolean(role)}
        initial={{
          serviceId,
          staffId,
          date,
          notes,
          step: one(query.step),
          mode: one(query.mode),
        }}
      />
    );
  }

  // ---------------------------------------------------------- review
  if (!role) {
    redirect(`/login?redirect=${encodeURIComponent(selfHref)}`);
  }

  if (!serviceId || !counterId || !date) {
    return (
      <InvalidSelection
        salonId={id}
        title="Your selection is incomplete"
        message="We could not read the service, date or time for this booking. Please pick them again."
        retryHref={chooseHref}
      />
    );
  }

  const [salonRes, slotRes, walletRes, settingsRes] = await Promise.all([
    getSingleSalon(id),
    // Deliberately unfiltered by status: we want to know if the slot has been
    // taken since the customer picked it, not just that it vanished. Past times
    // are filtered though - a customer who left this page open should be sent
    // back to pick again rather than reaching the pay button on a dead slot.
    getSlots({ salonId: id, date, upcomingOnly: true }),
    getMyWallet(),
    getPublicSettings(),
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
        title="That time is no longer available"
        message="The service or time you chose isn't available anymore. Pick another time to continue."
        retryHref={chooseHref}
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
        retryHref={chooseHref}
      />
    );
  }

  const priceMinor = service.priceMinor ?? 0;
  // Salon booking payments are a platform switch; off means a free booking.
  const paymentsEnabled = bookingPaymentsEnabled(
    settingsRes.success ? settingsRes.data : null,
  );
  const depositMinor = resolveDepositMinor(
    { depositMinor: salon.depositMinor, depositPercent: salon.depositPercent },
    priceMinor,
    paymentsEnabled,
  );

  const wallet = walletRes?.success ? walletRes.data : undefined;

  // "Pay ৳450 now" is offered when the platform switch and the salon's own
  // opt-in are both on; the API checks both again on booking.
  const prepayAllowed =
    paymentsEnabled &&
    settingsRes.success &&
    settingsRes.data?.["booking.prepayEnabled"] === true &&
    salon.acceptsPrepay === true &&
    priceMinor > depositMinor;

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
      prepayAllowed={prepayAllowed}
      wallet={{
        available: wallet?.availableMinor ?? 0,
        balance: wallet?.balanceMinor ?? 0,
        held: wallet?.heldBalanceMinor ?? 0,
        isFrozen: wallet?.isFrozen ?? false,
        loaded: Boolean(wallet),
      }}
      editHref={chooseHref}
      salonHref={`/salons/${id}`}
      returnHref={selfHref}
      reopenTopup={
        one(query.topup) === "1"
          ? { method: isProviderId(topupMethod) ? topupMethod : undefined }
          : undefined
      }
    />
  );
};

export default BookingPage;
