"use client";

import { runsBranch } from "@/lib/owner-access";
import { useState, useTransition } from "react";
import { MoveRight } from "lucide-react";
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
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={row.status} />
            {row.token && <TokenPill token={row.token} />}
            {row.staffName && <span className="text-muted-foreground">with {row.staffName}</span>}
            {row.counterName && <span className="text-muted-foreground">· {row.counterName}</span>}
          </div>
          {row.contact && <p className="text-sm text-muted-foreground">{row.contact}</p>}

          {moving && (
            <section aria-label="Free times" className="space-y-2">
              <p className="text-sm font-medium">Move to a free time on {formatDay(row.date)}</p>
              {freeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No free {row.service} slots left that day. Open more on the Slots page.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {freeSlots.map((slot) => (
                    <li key={slot.id}>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("w-full tabular-nums")}
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
              <p className="text-xs text-muted-foreground">Price and deposit stay the same.</p>
            </section>
          )}
        </div>
      )}
    </ResponsiveDialog>
  );
}
