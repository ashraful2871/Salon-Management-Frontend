"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Navigation,
  Phone,
  Scissors,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import CopyButton from "@/components/Wallet/CopyButton";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatBDT } from "@/lib/money";
import {
  bookingEventDescription,
  calendarFileName,
  calendarHref,
} from "@/lib/calendar";

export type ConfirmedBooking = {
  id: string;
  salonId: string;
  salonName: string;
  salonAddress?: string | null;
  salonPhone?: string | null;
  serviceName: string;
  serviceDuration?: number | null;
  staffName?: string | null;
  counterName?: string | null;
  date: string;
  startTime: string;
  endTime?: string | null;
  status: string;
  notes?: string | null;
  totalMinor: number;
  depositMinor: number;
  /** The server's figure for what is left to pay; preferred when present. */
  amountDueMinor?: number | null;
  serialNumber?: number | null;
  token?: string | null;
};

const formatCalendarDate = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatClock = (time?: string | null) => {
  if (!time) return "";
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

const Row = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-3">
    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft">
      <Icon className="h-4 w-4 text-primary" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold break-words">{value}</p>
    </div>
  </div>
);

const BookingConfirmed = ({ booking }: { booking: ConfirmedBooking }) => {
  const reference = booking.id.slice(0, 8).toUpperCase();
  const dueAtSalonMinor =
    booking.amountDueMinor ??
    Math.max(booking.totalMinor - booking.depositMinor, 0);
  const hasSerial =
    booking.serialNumber !== null && booking.serialNumber !== undefined;
  // The token is what the counter asks for; the ref is only a fallback so the
  // customer is never handed two codes.
  const code = booking.token || reference;
  const codeLabel = booking.token ? "Token" : "Booking reference";
  const queueLine = [booking.counterName, booking.staffName]
    .filter(Boolean)
    .join(" · ");

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [booking.salonName, booking.salonAddress].filter(Boolean).join(", "),
  )}`;

  return (
    <div className="min-h-screen bg-surface-subtle py-10 md:py-14">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft md:size-20">
            <CheckCircle2 className="size-9 text-success md:size-11" aria-hidden />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold md:text-4xl">
            You&apos;re booked
          </h1>
          <p className="mt-2 text-muted-foreground">
            We have emailed the confirmation to you. {booking.salonName} is
            expecting you.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <Card className="gap-0 border-primary/30 py-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Show this at the counter
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="font-mono text-3xl font-bold tracking-widest break-all md:text-4xl">
                  {code}
                </span>
                <CopyButton value={code} label={codeLabel} className="size-11" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{codeLabel}</p>
              {hasSerial && (
                <p className="mt-4 font-display text-xl font-semibold tabular-nums text-primary">
                  Serial #{booking.serialNumber}
                </p>
              )}
              {queueLine && (
                <p className="mt-1 text-sm text-muted-foreground">{queueLine}</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Appointment details</CardTitle>
              <ToneBadge status={booking.status} />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                <Row icon={Store} label="Salon" value={booking.salonName} />
                <Row
                  icon={CalendarDays}
                  label="Date · time"
                  value={
                    `${formatCalendarDate(booking.date)} · ${formatClock(booking.startTime)}` +
                    (booking.endTime ? ` – ${formatClock(booking.endTime)}` : "")
                  }
                />
                <Row
                  icon={Scissors}
                  label="Service"
                  value={
                    booking.serviceDuration
                      ? `${booking.serviceName} · ${booking.serviceDuration} min`
                      : booking.serviceName
                  }
                />
                <Row
                  icon={Wallet}
                  label="Amount"
                  value={
                    <span className="tabular-nums">{formatBDT(booking.totalMinor)}</span>
                  }
                />
              </div>

              {booking.notes && (
                <>
                  <Separator className="my-2" />
                  <p className="pt-3 text-sm">
                    <span className="text-muted-foreground">Your notes: </span>
                    {booking.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-primary" aria-hidden />
                What has been paid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Service price</span>
                <span className="font-medium tabular-nums">
                  {formatBDT(booking.totalMinor)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Deposit held from your wallet
                </span>
                <span className="font-semibold text-primary tabular-nums">
                  {formatBDT(booking.depositMinor)}
                </span>
              </div>
              <Separator />
              <p className="text-base font-semibold">
                {dueAtSalonMinor > 0 ? (
                  <>
                    Pay{" "}
                    <span className="font-bold tabular-nums">
                      {formatBDT(dueAtSalonMinor)}
                    </span>{" "}
                    at the salon
                  </>
                ) : (
                  "Nothing more to pay at the salon"
                )}
              </p>
              <p className="flex items-start gap-2 rounded-lg bg-surface-subtle p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                The deposit is held, not spent. It comes off your bill when you
                arrive, and returns to your wallet in full if you cancel in time.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button asChild size="lg" className="sm:flex-1">
              <Link href="/dashboard/appointments">View my bookings</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="sm:flex-1">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                <Navigation aria-hidden /> Get directions
              </a>
            </Button>
          </div>
          <div className="text-center">
            <Button asChild variant="ghost" size="sm">
              <a
                href={calendarHref({
                  id: booking.id,
                  date: booking.date,
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  title: `${booking.serviceName} at ${booking.salonName}`,
                  location: booking.salonAddress,
                  description: bookingEventDescription({
                    token: booking.token,
                    serialNumber: booking.serialNumber,
                    dueAtSalonMinor,
                  }),
                })}
                download={calendarFileName(booking.salonName, booking.date)}
              >
                <CalendarPlus aria-hidden /> Add to calendar
              </a>
            </Button>
          </div>

          {booking.salonPhone && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span>
                Need to change something? Call the salon on{" "}
                <a href={`tel:${booking.salonPhone}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {booking.salonPhone}
                </a>
                .
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;
