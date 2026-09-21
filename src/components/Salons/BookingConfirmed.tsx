"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { formatBDT } from "@/lib/money";

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
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <div className="min-w-0 flex-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
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
  const queueLine = [
    booking.serviceName,
    booking.counterName,
    formatClock(booking.startTime),
  ]
    .filter(Boolean)
    .join(" · ");

  const copy = async (value: string, what: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} copied`);
    } catch {
      toast.error(`Could not copy the ${what.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sage/15">
            <CheckCircle2 className="h-11 w-11 text-sage" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold md:text-4xl">
            Your appointment is booked
          </h1>
          <p className="mt-2 text-muted-foreground">
            We have emailed the confirmation to you. {booking.salonName} is
            expecting you.
          </p>

          {/* The token is what the counter asks for; the ref is only a
              fallback so the customer is never handed two codes. */}
          {!booking.token && (
            <button
              type="button"
              onClick={() => copy(reference, "Booking reference")}
              className="mt-5 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <span className="text-muted-foreground">Booking ref</span>
              <span className="font-mono font-bold tracking-wider">
                {reference}
              </span>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="mt-8 space-y-6"
        >
          {(hasSerial || booking.token) && (
            <Card className="border-primary/30 shadow-sm">
              <CardContent className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Show this at the counter
                </p>
                {hasSerial && (
                  <p className="mt-3 font-serif text-5xl font-bold tabular-nums text-primary md:text-6xl">
                    Serial #{booking.serialNumber}
                  </p>
                )}
                <p className="mt-3 font-medium">{queueLine}</p>
                {booking.token && (
                  <button
                    type="button"
                    onClick={() => copy(booking.token ?? "", "Token")}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-muted/40 px-4 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="text-muted-foreground">Token</span>
                    <span className="font-mono font-bold tracking-wider">
                      {booking.token}
                    </span>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Appointment details</CardTitle>
              <Badge variant="secondary" className="uppercase">
                {booking.status.replace(/_/g, " ")}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
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
                  icon={CalendarDays}
                  label="Date"
                  value={formatCalendarDate(booking.date)}
                />
                <Row
                  icon={Clock}
                  label="Time"
                  value={
                    booking.endTime
                      ? `${formatClock(booking.startTime)} – ${formatClock(booking.endTime)}`
                      : formatClock(booking.startTime)
                  }
                />
                <Row
                  icon={Store}
                  label="Counter"
                  value={booking.counterName || "Assigned at the salon"}
                />
                <Row
                  icon={UserRound}
                  label="Specialist"
                  value={booking.staffName || "Assigned by the salon"}
                />
                <Row
                  icon={MapPin}
                  label="Where"
                  value={booking.salonAddress || booking.salonName}
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
                <Wallet className="h-4 w-4 text-primary" />
                What has been paid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service price</span>
                <span className="font-medium">
                  {formatBDT(booking.totalMinor)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Deposit held from your wallet
                </span>
                <span className="font-semibold text-primary">
                  {formatBDT(booking.depositMinor)}
                </span>
              </div>
              <Separator />
              <p className="text-base font-semibold">
                {dueAtSalonMinor > 0 ? (
                  <>
                    Pay{" "}
                    <span className="font-bold">
                      {formatBDT(dueAtSalonMinor)}
                    </span>{" "}
                    at the salon
                  </>
                ) : (
                  "Nothing more to pay at the salon"
                )}
              </p>
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
                The deposit is held, not spent. It comes off your bill when you
                arrive, and returns to your wallet in full if you cancel in time.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link href="/dashboard/appointments">View my bookings</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link href={`/salons/${booking.salonId}`}>Back to the salon</Link>
            </Button>
          </div>

          {booking.salonPhone && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Need to change something? Call the salon on {booking.salonPhone}.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmed;
