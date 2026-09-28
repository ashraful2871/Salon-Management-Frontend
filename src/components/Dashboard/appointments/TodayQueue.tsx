"use client";

import { useMemo, useState } from "react";
import { ListOrdered } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Appointment } from "@/lib/api-types";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { DataList } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import {
  SalonRowActions,
  queueColumns,
  toAppointmentRow,
  type AppointmentRow,
} from "./AppointmentRow";
import { dhakaToday } from "./format";
import { useAppointmentActions } from "./useAppointmentActions";
import { useBookingDialogs } from "./useBookingDialogs";

// "2:30 PM" in Dhaka, so the server's render and the browser's agree.
const clock = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

const DONE = new Set(["COMPLETED", "CANCELLED", "NO_SHOW"]);

// Serial is the slot's position in the day, so it is the calling order. Rows
// without one (older bookings) fall back to their start time.
const bySerial = (a: AppointmentRow, b: AppointmentRow) =>
  (a.serial ?? Infinity) - (b.serial ?? Infinity) ||
  a.raw.startTime.localeCompare(b.raw.startTime);

/**
 * Today's whole book, one section per service line in calling order. It uses
 * the list's table and row actions, so both tabs read and work the same.
 */
export const TodayQueue = ({
  appointments,
  role,
}: {
  appointments: Appointment[];
  role: string;
}) => {
  const [showCancelled, setShowCancelled] = useState(false);
  const actions = useAppointmentActions();
  // Only the queue is polled, and never over a change still in flight.
  const { queue, updatedAt } = useLiveQueue(
    appointments,
    20_000,
    actions.pendingId !== null,
  );
  const { withPending } = actions;
  const today = dhakaToday();
  const rows = useMemo(
    () => withPending(queue).map((a) => toAppointmentRow(a, updatedAt, today)),
    [withPending, queue, updatedAt, today],
  );
  const columns = useMemo(() => queueColumns({ today }), [today]);
  const { openCancel, openAssign, openView, dialogs } = useBookingDialogs({
    actions,
    rows,
  });

  // One line per service and counter, which is how serials are numbered; the
  // salon is named too when the owner runs more than one.
  const multiSalon = new Set(rows.map((r) => r.salonId)).size > 1;
  const lineOf = (r: AppointmentRow) =>
    [multiSalon ? r.salonName : null, r.service, r.counterName ?? "No counter"]
      .filter(Boolean)
      .join(" · ");

  const cancelledCount = rows.filter((r) => r.status === "CANCELLED").length;
  const shown = rows
    .filter((r) => showCancelled || r.status !== "CANCELLED")
    .sort((a, b) => lineOf(a).localeCompare(lineOf(b)) || bySerial(a, b));
  const waiting = shown.filter((r) => !DONE.has(r.status)).length;

  return (
    <section aria-labelledby="today-queue-title" className="space-y-4">
      <h2 id="today-queue-title" className="sr-only">
        Today&apos;s queue
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{waiting} waiting</span>
          {" · "}
          {shown.length - waiting} done
          {" · "}
          {/* The server's render and the browser's can straddle a minute. */}
          <span suppressHydrationWarning>Updated {clock.format(updatedAt)}</span>
        </p>
        <div className="flex items-center gap-2">
          <Switch
            id="queue-show-cancelled"
            checked={showCancelled}
            onCheckedChange={setShowCancelled}
          />
          <Label htmlFor="queue-show-cancelled" className="text-sm font-normal">
            Show cancelled{cancelledCount > 0 && ` (${cancelledCount})`}
          </Label>
        </div>
      </div>

      <DataList
        items={shown}
        rowKey={(r) => r.id}
        columns={columns}
        // The same switch point as the list, so both tabs change layout together.
        tableFrom="4xl"
        caption="Today's queue"
        groupOf={lineOf}
        groupHeader={(line, lineRows) => {
          const left = lineRows.filter((r) => !DONE.has(r.status)).length;
          return (
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-foreground">{line}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {left} waiting · {lineRows.length - left} done
              </span>
            </div>
          );
        }}
        rowClassName={(r) => (DONE.has(r.status) ? "opacity-60" : "")}
        empty={
          <div className="rounded-2xl border border-border bg-surface">
            <EmptyState
              icon={ListOrdered}
              title="No bookings in today's queue"
              description="Today's bookings show up here as they come in."
            />
          </div>
        }
        rowActions={(row, layout) => (
          <SalonRowActions
            row={row}
            layout={layout}
            role={role}
            actions={actions}
            onAssign={openAssign}
            onCancel={openCancel}
            onView={openView}
          />
        )}
      />

      {dialogs}
    </section>
  );
};
