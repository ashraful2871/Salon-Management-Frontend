"use client";

import { runsBranch } from "@/lib/owner-access";
import { useState, useTransition } from "react";
import { Banknote, Clock, LayoutGrid, MoveRight, Phone, Scissors, UserRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatBDT } from "@/lib/money";
import { PaymentBadge, hasPaymentBadge } from "@/components/Dashboard/appointments/PaymentBadge";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { StatusBadge } from "@/components/Dashboard/appointments/StatusBadge";
import { SalonRowActions, TokenPill, type AppointmentRow } from "@/components/Dashboard/appointments/AppointmentRow";
import type { AppointmentActions } from "@/components/Dashboard/appointments/useAppointmentActions";
import { formatDay, formatTime12 } from "@/components/Dashboard/appointments/format";
import { rescheduleAppointment } from "@/services/appoinments/rescheduleAppointment";
import type { CalendarSlot } from "@/services/appoinments/calendar-types";
import { cn } from "@/lib/utils";

const MOVABLE = new Set(["PENDING", "CONFIRMED"]);

/**
 * One booking from the calendar: its next desk step (the list's own
 * actions and dialogs), and Move into another free slot of the same service.
 */
export function BookingSheet({
  row,
  open,
  onOpenChange,
  role,
  readOnly,
  actions,
  freeSlots,
  onAssign,
  onCancel,
  onView,
}: {
  row: AppointmentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: string;
  readOnly: boolean;
  actions: AppointmentActions;
  /** Free slots of this booking's service on its day, not yet started. */
  freeSlots: CalendarSlot[];
  onAssign: (row: AppointmentRow) => void;
  onCancel: (row: AppointmentRow) => void;
  onView: (row: AppointmentRow) => void;
}) {
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canMove = !readOnly && runsBranch(role) && !!row && MOVABLE.has(row.status);

  const move = (slot: CalendarSlot) => {
    if (!row) return;
    setTarget(slot.id);
    startTransition(async () => {
      const res = await rescheduleAppointment(row.id, slot.id);
      showResultToast(
        res,
        `Moved to ${formatTime12(slot.start.slice(11, 16))}. The customer gets an email.`,
        "Failed to move the booking",
      );
      setTarget(null);
      if (res.success) {
        setMoving(false);
        onOpenChange(false);
      }
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setMoving(false);
        onOpenChange(next);
      }}
      title={row ? `${row.customer} · ${row.service}` : "Booking"}
      description={row && [row.serial !== null ? `#${row.serial}` : null, formatDay(row.date), row.time].filter(Boolean).join(" · ")}
      footer={
        row && !readOnly ? (
          <div className="flex w-full flex-wrap items-center gap-2">
            <SalonRowActions
              row={row}
              layout="card"
              role={role}
              actions={actions}
              onAssign={onAssign}
              onCancel={onCancel}
              onView={onView}
            />
            {canMove && (
              <Button variant="outline" size="sm" onClick={() => setMoving((m) => !m)} aria-expanded={moving}>
                <MoveRight aria-hidden="true" />
                Move
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        )
      }
    >
      {row && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={row.status} />
            {hasPaymentBadge(row.raw.paymentState) && <PaymentBadge appointment={row.raw} />}
            {row.token && <TokenPill token={row.token} />}
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border text-sm">
            <Detail icon={Clock} label="Time">
              {row.time}
              {row.duration && <span className="text-muted-foreground"> · {row.duration}</span>}
            </Detail>
            <Detail icon={Scissors} label="Service">
              {row.service}
            </Detail>
            <Detail icon={UserRound} label="Stylist">
              {row.staffName ?? <span className="text-muted-foreground">Not assigned</span>}
            </Detail>
            <Detail icon={Banknote} label="Price">
              {formatBDT(row.priceMinor)}
            </Detail>
            {row.counterName && (
              <Detail icon={LayoutGrid} label="Counter">
                {row.counterName}
              </Detail>
            )}
            {row.contact && (
              <Detail icon={Phone} label="Contact" wide={!row.counterName}>
                <span className="[overflow-wrap:anywhere]">{row.contact}</span>
              </Detail>
            )}
          </dl>

          {moving && (
            <section aria-label="Free times" className="space-y-2 rounded-2xl border border-border bg-surface-subtle p-4">
              <p className="text-sm font-semibold">Move to another free time on {formatDay(row.date)}</p>
              {freeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No free {row.service} times left that day. Open more on the Slots page.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {freeSlots.map((slot) => (
                    <li key={slot.id}>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("w-full bg-surface tabular-nums")}
                        loading={pending && target === slot.id}
                        disabled={pending}
                        onClick={() => move(slot)}
                      >
                        {formatTime12(slot.start.slice(11, 16))}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">Price and deposit stay the same. The customer gets an email.</p>
            </section>
          )}
        </div>
      )}
    </ResponsiveDialog>
  );
}

function Detail({
  icon: Icon,
  label,
  wide = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 bg-surface px-3.5 py-3", wide && "col-span-2")}>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{children}</dd>
    </div>
  );
}
