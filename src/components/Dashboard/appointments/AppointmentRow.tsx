"use client";

import { Eye, MoreHorizontal, Play, User, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Column, DataListLayout } from "@/components/Shared/DataList";
import { formatBDT } from "@/lib/money";
import type { Appointment } from "@/lib/api-types";
import { StatusBadge } from "./StatusBadge";
import { PaymentBadge, hasPaymentBadge } from "./PaymentBadge";
import { NextAction, hasNextAction } from "./NextAction";
import { formatDay, formatTime12, startsAtOf } from "./format";
import type { AppointmentActions } from "./useAppointmentActions";

/** A booking as the list shows it, with the raw one kept for the actions. */
export type AppointmentRow = {
  id: string;
  raw: Appointment;
  date: string;
  customer: string;
  /** Email and/or phone, whichever the name doesn't already show. */
  contact: string;
  service: string;
  time: string;
  duration: string | null;
  priceMinor: number;
  status: Appointment["status"];
  salonId?: string;
  salonName?: string;
  counterName?: string;
  staffName?: string;
  token: string | null;
  serial: number | null;
  /** "#5 · Haircut · Counter A": the customer's place in the line. */
  serialLine: string;
  hasStarted: boolean;
  isToday: boolean;
  isPast: boolean;
};

export const toAppointmentRow = (
  apt: Appointment,
  nowMs: number,
  today: string,
): AppointmentRow => {
  const date = apt.appointmentDate?.slice(0, 10) ?? "";
  const name = apt.customer?.name?.trim();
  const email = apt.customer?.email?.trim();
  const phone = apt.customer?.phone?.trim();
  // A placeholder name tells the desk nothing; the email does.
  const customer =
    name && name !== "User" && name !== "Unknown" ? name : email || "Unknown";
  const service = apt.service?.name || "Service";
  const serial = typeof apt.serialNumber === "number" ? apt.serialNumber : null;
  const startsAt = startsAtOf(date, apt.startTime);

  return {
    id: apt.id,
    raw: apt,
    date,
    customer,
    contact: [email !== customer ? email : null, phone].filter(Boolean).join(" · "),
    service,
    time: formatTime12(apt.startTime),
    duration:
      typeof apt.service?.duration === "number" ? `${apt.service.duration} min` : null,
    priceMinor: apt.totalMinor ?? 0,
    status: apt.status ?? "PENDING",
    salonId: apt.salon?.id,
    salonName: apt.salon?.name,
    counterName: apt.counter?.name,
    staffName: apt.staff?.user?.name,
    token: apt.token ?? null,
    serial,
    serialLine: [serial !== null ? `#${serial}` : null, service, apt.counter?.name]
      .filter(Boolean)
      .join(" · "),
    // Drives what may be done, not just what is shown: the appointment is
    // over to the customer once it starts, and off the salon's desk on any
    // day but today.
    hasStarted: startsAt ? startsAt.getTime() <= nowMs : false,
    isToday: date === today,
    isPast: date < today,
  };
};

/* ---------- What each side may do ---------- */

// Only a booking nobody has acted on yet; from check-in on, the API refuses.
export const customerCanCancel = (row: AppointmentRow) =>
  !row.hasStarted && (row.status === "PENDING" || row.status === "CONFIRMED");

// The API lets the owner cancel anything not yet being served. A past day's
// leftovers are the no-show job's, so they are not offered here.
const salonCanCancel = (row: AppointmentRow, role: string) =>
  role === "SALON_OWNER" &&
  !row.isPast &&
  (row.status === "PENDING" ||
    row.status === "CONFIRMED" ||
    row.status === "CHECKED_IN");

// The salon works today's book; an upcoming or past booking is not acted on
// from the desk.
const canAssign = (row: AppointmentRow, role: string) =>
  role === "SALON_OWNER" &&
  row.isToday &&
  row.status !== "COMPLETED" &&
  row.status !== "CANCELLED" &&
  row.status !== "NO_SHOW";

/* ---------- Cells ---------- */

const SerialPill = ({ serial }: { serial: number }) => (
  <span className="inline-flex h-6 min-w-7 items-center justify-center rounded-md bg-primary-soft px-1.5 text-xs font-bold text-primary-hover tabular-nums">
    #{serial}
  </span>
);

export const TokenPill = ({ token }: { token: string }) => (
  <span className="inline-flex h-6 w-fit items-center whitespace-nowrap rounded-md border border-dashed border-primary/40 bg-surface-subtle px-2 font-mono text-[11px] font-semibold tracking-wider text-foreground">
    {token}
  </span>
);

/** "Sat 26 Sep", with the year only when it isn't this one. */
const dayOf = (row: AppointmentRow, today: string) =>
  formatDay(row.date, row.date.slice(0, 4) !== today.slice(0, 4));

export const salonColumns = ({
  showDate,
  today,
}: {
  showDate: boolean;
  today: string;
}): Column<AppointmentRow>[] => [
  {
    key: "queue",
    header: "#",
    mobile: "eyebrow",
    // As narrow as the token allows.
    className: "w-px",
    cell: (r) =>
      r.serial === null && !r.token ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <div className="flex flex-col items-start gap-1">
          {r.serial !== null && <SerialPill serial={r.serial} />}
          {r.token && <TokenPill token={r.token} />}
        </div>
      ),
    mobileCell: (r) => (r.serial !== null ? `#${r.serial}` : null),
  },
  {
    key: "customer",
    header: "Customer",
    mobile: "primary",
    cell: (r) => (
      <div className="min-w-0">
        <p className="break-words font-medium text-foreground">{r.customer}</p>
        {r.contact && (
          <p className="break-all text-xs text-muted-foreground">{r.contact}</p>
        )}
      </div>
    ),
    mobileCell: (r) => r.customer,
  },
  {
    key: "service",
    header: "Service",
    mobile: "secondary",
    cell: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.service}</p>
        {/* The "Where" column's detail, while that column is hidden. */}
        {(r.counterName || r.staffName) && (
          <p className="text-xs text-muted-foreground @5xl:hidden">
            {[r.counterName, r.staffName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    ),
    mobileCell: (r) => r.service,
  },
  {
    key: "where",
    header: "Where",
    mobile: "secondary",
    className: "hidden @5xl:table-cell",
    cell: (r) => (
      <div className="text-xs text-muted-foreground">
        <p className="text-sm text-foreground">{r.salonName ?? "—"}</p>
        {r.counterName && <p>{r.counterName}</p>}
        {r.staffName && (
          <p className="inline-flex items-center gap-1">
            <User aria-hidden="true" className="size-3" />
            {r.staffName}
          </p>
        )}
      </div>
    ),
    mobileCell: (r) => r.counterName ?? null,
  },
  {
    key: "time",
    header: showDate ? "When" : "Time",
    mobile: "eyebrow",
    cell: (r) => (
      <div className="whitespace-nowrap tabular-nums">
        {showDate && (
          <p className="font-medium text-foreground">{dayOf(r, today)}</p>
        )}
        <p className={showDate ? "text-xs text-muted-foreground" : "font-medium text-foreground"}>
          {r.time}
        </p>
        {r.duration && <p className="text-xs text-muted-foreground">{r.duration}</p>}
      </div>
    ),
    mobileCell: (r) => (showDate ? `${dayOf(r, today)} · ${r.time}` : r.time),
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    mobile: "hidden",
    cell: (r) => (
      <span className="whitespace-nowrap font-medium text-foreground">
        {formatBDT(r.priceMinor)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    mobile: "trailing",
    cell: (r) => (
      <div className="flex flex-col items-start gap-1">
        <StatusBadge status={r.status} />
        <PaymentBadge appointment={r.raw} viewer="owner" />
      </div>
    ),
    // The card's trailing column already stacks and right-aligns them.
    mobileCell: (r) => (
      <>
        <StatusBadge status={r.status} />
        <PaymentBadge appointment={r.raw} viewer="owner" />
      </>
    ),
  },
];

/**
 * Today's queue: the same columns as the list, so the two tabs read alike,
 * minus Service and Where (each line's heading names them) plus who serves.
 */
export const queueColumns = ({ today }: { today: string }): Column<AppointmentRow>[] => {
  const base = salonColumns({ showDate: false, today }).filter(
    (c) => c.key !== "service" && c.key !== "where",
  );
  const staff: Column<AppointmentRow> = {
    key: "staff",
    header: "Staff",
    mobile: "secondary",
    cell: (r) =>
      r.staffName ? (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <User aria-hidden="true" className="size-3.5 text-muted-foreground" />
          {r.staffName}
        </span>
      ) : (
        <span className="text-muted-foreground">Not assigned</span>
      ),
    mobileCell: (r) => r.staffName ?? null,
  };
  const at = base.findIndex((c) => c.key === "customer") + 1;
  return [...base.slice(0, at), staff, ...base.slice(at)];
};

export const customerColumns = ({
  today,
}: {
  today: string;
}): Column<AppointmentRow>[] => [
  {
    key: "booking",
    header: "Booking",
    mobile: "primary",
    cell: (r) => (
      // A customer's own name tells them nothing; their place in the line and
      // the token to quote do.
      <div className="flex flex-col items-start gap-1.5">
        <span className="font-semibold text-foreground tabular-nums">{r.serialLine}</span>
        {r.token && <TokenPill token={r.token} />}
      </div>
    ),
  },
  {
    key: "salon",
    header: "Salon",
    mobile: "secondary",
    cell: (r) => (
      <div>
        <p className="text-foreground">{r.salonName ?? "—"}</p>
        {r.staffName && (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <User aria-hidden="true" className="size-3" />
            {r.staffName}
          </p>
        )}
      </div>
    ),
    mobileCell: (r) =>
      [r.salonName, r.staffName].filter(Boolean).join(" · ") || null,
  },
  {
    key: "when",
    header: "When",
    mobile: "meta",
    cell: (r) => (
      <div className="whitespace-nowrap tabular-nums">
        <p className="font-medium text-foreground">{dayOf(r, today)}</p>
        <p className="text-xs text-muted-foreground">
          {r.time}
          {r.duration && ` · ${r.duration}`}
        </p>
      </div>
    ),
    mobileCell: (r) => `${dayOf(r, today)} · ${r.time}`,
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    mobile: "hidden",
    cell: (r) => (
      <span className="whitespace-nowrap font-medium text-foreground">
        {formatBDT(r.priceMinor)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    mobile: "trailing",
    cell: (r) => (
      <StatusBadge status={r.status} className="whitespace-normal text-left">
        {r.status === "CHECKED_IN" ? "Checked in – you're in the queue" : undefined}
      </StatusBadge>
    ),
    mobileCell: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "payment",
    header: "Payment",
    mobile: "meta",
    cell: (r) =>
      hasPaymentBadge(r.raw.paymentState, "customer") ? (
        <PaymentBadge appointment={r.raw} viewer="customer" />
      ) : null,
  },
];

/* ---------- Actions ---------- */

export const CustomerRowActions = ({
  row,
  onCancel,
}: {
  row: AppointmentRow;
  onCancel: (row: AppointmentRow) => void;
}) => (
  <Button
    variant="outline"
    size="sm"
    className="text-danger hover:bg-danger-soft hover:text-danger"
    onClick={() => onCancel(row)}
  >
    <XCircle aria-hidden="true" />
    Cancel
  </Button>
);

/**
 * The desk's next step as the row's one pill, and everything else in ⋯.
 * In a card the pill takes the width and ⋯ stays on the right.
 */
export const SalonRowActions = ({
  row,
  layout,
  role,
  actions,
  onAssign,
  onCancel,
  onView,
}: {
  row: AppointmentRow;
  layout: DataListLayout;
  role: string;
  actions: AppointmentActions;
  onAssign: (row: AppointmentRow) => void;
  onCancel: (row: AppointmentRow) => void;
  onView: (row: AppointmentRow) => void;
}) => {
  const card = layout === "card";
  const pending = actions.isPending(row.id);
  const assign = canAssign(row, role);
  const cancel = salonCanCancel(row, role);
  // A pending booking has no desk step of its own; assigning confirms it.
  const assignFirst = assign && row.status === "PENDING";
  const next = row.isToday && hasNextAction(row.raw);
  const canStart = row.isToday && row.status === "CHECKED_IN";

  return (
    <>
      {next ? (
        <NextAction
          appointment={row.raw}
          actions={actions}
          hideStart
          compact={!card}
          className={card ? "flex-1" : undefined}
        />
      ) : assignFirst ? (
        <Button
          size="sm"
          className={card ? "flex-1" : undefined}
          loading={pending}
          onClick={() => onAssign(row)}
        >
          <UserPlus aria-hidden="true" />
          Assign staff
        </Button>
      ) : (
        card && <span aria-hidden="true" className="flex-1" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            disabled={pending}
            aria-label={`More actions for ${row.customer}`}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canStart && (
            <DropdownMenuItem onSelect={() => actions.start(row.id)}>
              <Play aria-hidden="true" />
              Start service
            </DropdownMenuItem>
          )}
          {assign && !assignFirst && (
            <DropdownMenuItem onSelect={() => onAssign(row)}>
              <UserPlus aria-hidden="true" />
              {row.staffName ? "Change staff" : "Assign staff"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => onView(row)}>
            <Eye aria-hidden="true" />
            View details
          </DropdownMenuItem>
          {cancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onCancel(row)}>
                <XCircle aria-hidden="true" />
                Cancel booking
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
