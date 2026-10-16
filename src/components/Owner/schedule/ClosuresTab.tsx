"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { createClosure, deleteClosure } from "@/services/schedule/scheduleActions";
import type { ClosureBooking, SalonClosure } from "@/services/schedule/schedule-types";

const todayDhaka = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);

const dayLabel = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const whenLabel = (c: SalonClosure) => (c.allDay ? "Closed all day" : `Closed ${c.startTime}–${c.endTime}`);

type Clash = { date: string; bookings: ClosureBooking[]; notice: string };

/** Manage salon → Closures: holidays and special hours, blocking every booking surface. */
export function ClosuresTab({ salonId, closures }: { salonId: string; closures: SalonClosure[] }) {
  const [list, removeOptimistic] = useOptimistic(closures, (rows: SalonClosure[], id: string) =>
    rows.filter((c) => c.id !== id),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [target, setTarget] = useState<SalonClosure | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clash, setClash] = useState<Clash | null>(null);
  const [, startTransition] = useTransition();

  const today = todayDhaka();
  const upcoming = list.filter((c) => c.date >= today);
  const past = list.filter((c) => c.date < today).reverse();

  const remove = () => {
    if (!target) return;
    const id = target.id;
    setConfirmOpen(false);
    startTransition(async () => {
      removeOptimistic(id);
      const res = await deleteClosure(salonId, id);
      showResultToast(
        res,
        res.data?.reopenedSlots ? `Closure removed, ${res.data.reopenedSlots} slots reopened` : "Closure removed",
        "Couldn't remove the closure",
      );
    });
  };

  const row = (c: SalonClosure, muted = false) => (
    <li key={c.id} className={`flex items-start justify-between gap-3 py-3 ${muted ? "opacity-60" : ""}`}>
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
          <CalendarOff className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{dayLabel(c.date)}</p>
          <p className="text-sm text-muted-foreground">
            {whenLabel(c)} · {c.reason}
          </p>
          {!!c.blockedSlots && (
            <p className="text-xs text-muted-foreground">
              {c.blockedSlots} open slot{c.blockedSlots === 1 ? "" : "s"} blocked
            </p>
          )}
        </div>
      </div>
      {!muted && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remove closure on ${dayLabel(c.date)}`}
          onClick={() => {
            setTarget(c);
            setConfirmOpen(true);
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      )}
    </li>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Closures</CardTitle>
          <CardDescription>
            Holidays and special hours. Nobody can book inside one: not online, in the chat or as a walk-in.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" />
          Add closure
        </Button>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="No closures coming up"
            description="Add Eid, a renovation day or shorter hours, and booking stops for that time."
          />
        ) : (
          <ul className="divide-y divide-border">{upcoming.map((c) => row(c))}</ul>
        )}
        {past.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">Past 30 days ({past.length})</summary>
            <ul className="divide-y divide-border">{past.map((c) => row(c, true))}</ul>
          </details>
        )}
      </CardContent>

      <AddClosureDialog
        salonId={salonId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onClash={setClash}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove this closure?"
        description={target ? `${dayLabel(target.date)} opens for booking again. Slots it blocked reopen.` : undefined}
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
      />

      <ResponsiveDialog
        open={!!clash}
        onOpenChange={(open) => !open && setClash(null)}
        title={clash?.notice ?? "Bookings in this closure"}
        description="These were booked before the closure and were not cancelled. Contact the customers, or cancel them from Appointments."
        footer={
          <>
            <Button variant="outline" onClick={() => setClash(null)}>
              Close
            </Button>
            {clash && (
              <Button asChild>
                <Link href={`/dashboard/appointments?date=${clash.date}`}>Open appointments</Link>
              </Button>
            )}
          </>
        }
      >
        <ul className="divide-y divide-border text-sm">
          {clash?.bookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{b.customerName ?? "Customer"}</p>
                <p className="truncate text-muted-foreground">
                  {b.startTime} · {b.serviceName ?? "Service"}
                  {b.serialNumber ? ` · #${b.serialNumber}` : ""}
                </p>
              </div>
              {b.customerPhone && (
                <a href={`tel:${b.customerPhone}`} className="shrink-0 font-medium text-primary hover:underline">
                  {b.customerPhone}
                </a>
              )}
            </li>
          ))}
        </ul>
      </ResponsiveDialog>
    </Card>
  );
}

function AddClosureDialog({
  salonId,
  open,
  onOpenChange,
  onClash,
}: {
  salonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClash: (clash: Clash) => void;
}) {
  const [date, setDate] = useState(todayDhaka);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("21:00");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const valid = !!date && reason.trim().length >= 2 && (allDay || endTime > startTime);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    startTransition(async () => {
      const res = await createClosure(salonId, {
        date,
        allDay,
        ...(allDay ? {} : { startTime, endTime }),
        reason: reason.trim(),
      });
      if (!res.success || !res.data) {
        showResultToast(res, "", "Couldn't add the closure");
        return;
      }
      showResultToast({ success: true }, "Closure added");
      if (res.data.bookings.length && res.data.notice) {
        onClash({ date, bookings: res.data.bookings, notice: res.data.notice });
      }
      setReason("");
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a closure"
      description="Open slots in that time are blocked. Bookings already made stay; we list them for you."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="closure-form" loading={pending} disabled={!valid}>
            Add closure
          </Button>
        </>
      }
    >
      <form id="closure-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="closure-date">Day</Label>
          <Input
            id="closure-date"
            type="date"
            value={date}
            min={todayDhaka()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>All day</span>
          <Switch checked={allDay} onCheckedChange={setAllDay} aria-label="All day" />
        </label>
        {!allDay && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="closure-start">Closed from</Label>
              <Input id="closure-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closure-end">Until</Label>
              <Input id="closure-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="closure-reason">Reason</Label>
          <Input
            id="closure-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={120}
            placeholder="Eid holiday, renovation, closing early…"
            required
          />
          <p className="text-xs text-muted-foreground">Shown to customers on your salon page.</p>
        </div>
        {!allDay && endTime <= startTime && <p className="text-xs text-danger">The end must be after the start.</p>}
      </form>
    </ResponsiveDialog>
  );
}
