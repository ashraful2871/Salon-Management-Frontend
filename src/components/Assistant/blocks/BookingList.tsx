"use client";

import { CalendarDays, MapPin, Ticket } from "lucide-react";

import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import { formatTime, formatYmd } from "../format";
import type { BlockProps } from "../block-props";

type BookingListBlock = Extract<Block, { type: "booking_list" }>;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

const STATUS_TONE: Record<string, string> = {
  CONFIRMED: "bg-sage/15 text-foreground",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-destructive/10 text-destructive",
};

/**
 * The customer's bookings, each with the token and serial they give at the
 * counter and what is still to pay. Every button is a server-sent action, so
 * Cancel here only ever opens the preview — never cancels on the first tap.
 */
const BookingList = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<BookingListBlock>) => {
  const bookings = block.bookings ?? [];
  if (bookings.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="rounded-xl border border-border bg-background p-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {booking.serviceName}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{booking.salonName}</span>
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                STATUS_TONE[booking.status] ?? "bg-primary/10 text-primary",
              )}
            >
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {formatYmd(booking.date)} · {formatTime(booking.startTime)}
            {booking.counterName ? (
              <span className="text-xs text-muted-foreground">
                · {booking.counterName}
              </span>
            ) : null}
          </p>

          {(booking.token || booking.serialNumber) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ticket className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {booking.token && (
                <span className="font-mono font-semibold text-foreground">
                  {booking.token}
                </span>
              )}
              {booking.serialNumber ? <span>Serial #{booking.serialNumber}</span> : null}
            </p>
          )}

          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex gap-1">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-medium text-foreground">
                {formatBDT(booking.totalMinor)}
              </dd>
            </div>
            {booking.depositMinor > 0 && (
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Deposit</dt>
                <dd className="font-medium text-foreground">
                  {formatBDT(booking.depositMinor)}
                </dd>
              </div>
            )}
            <div className="flex gap-1">
              <dt className="text-muted-foreground">At the salon</dt>
              <dd className="font-medium text-foreground">
                {formatBDT(booking.dueAtSalonMinor)}
              </dd>
            </div>
          </dl>

          {booking.actions?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {booking.actions.map((option, i) => (
                <Chip
                  key={`${option.label}-${i}`}
                  label={option.label}
                  icon={option.icon}
                  style={option.style}
                  selected={chosen === option.label}
                  disabled={disabled}
                  onClick={() => onAction(option.action, option.label)}
                />
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default BookingList;
