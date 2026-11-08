"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarX2, Clock, Scissors, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { EmptyState } from "@/components/Shared/EmptyState";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatTime12 } from "@/components/Dashboard/appointments/format";
import { bookWalkIn } from "@/services/appoinments/bookWalkIn";
import type { CalendarResource, CalendarSlot } from "@/services/appoinments/calendar-types";
import { cn } from "@/lib/utils";
import { minutesOf } from "./calendar-grid";
import { durationLabel, servicesOf, type FreeOption } from "./availability";

const NO_STYLIST = "none";

/** True when one of the stylist's off ranges touches the slot. The API checks again. */
const isOff = (stylist: CalendarResource, slot: CalendarSlot) => {
  const day = slot.start.slice(0, 10);
  const s = minutesOf(slot.start) ?? 0;
  const e = Math.max(minutesOf(slot.end) ?? s, s + 1);
  return (stylist.off ?? []).some(
    (o) => o.start.slice(0, 10) === day && (minutesOf(o.start) ?? 0) < e && (minutesOf(o.end) ?? 0) > s,
  );
};

export type WalkInStart = { serviceKey?: string; start?: string } | null;

/**
 * Book a customer at the desk or on the phone into a free time: service, then
 * time, then who. Opened from "New booking", a free block on the grid or a
 * time in the Available panel (which preselect what was tapped). Remount it
 * (change `key`) on every open so it starts from `initial`.
 */
export function WalkInDialog({
  options,
  initial,
  open,
  onOpenChange,
  stylists = [],
  dayLabel,
}: {
  /** The day's free times that haven't started. */
  options: FreeOption[];
  initial: WalkInStart;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylists?: CalendarResource[];
  dayLabel: string;
}) {
  const services = useMemo(() => servicesOf(options), [options]);
  const firstAt = initial?.start
    ? options.find((o) => o.start === initial.start && (!initial.serviceKey || o.serviceKey === initial.serviceKey))
    : undefined;
  const [serviceKey, setServiceKey] = useState(
    firstAt?.serviceKey ?? initial?.serviceKey ?? services[0]?.key ?? "",
  );
  const [start, setStart] = useState<string | null>(firstAt?.start ?? null);
  const [staffId, setStaffId] = useState(NO_STYLIST);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const times = options.filter((o) => o.serviceKey === serviceKey);
  const chosen = times.find((o) => o.start === start) ?? null;
  const slot = chosen?.slots[0] ?? null;
  const service = services.find((s) => s.key === serviceKey);

  const pickService = (key: string) => {
    setServiceKey(key);
    // Keep the time when the new service is free then too.
    if (!options.some((o) => o.serviceKey === key && o.start === start)) setStart(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    startTransition(async () => {
      const res = await bookWalkIn({
        slotId: slot.id,
        customerName: name,
        customerPhone: phone,
        notes: notes.trim() || undefined,
        ...(staffId !== NO_STYLIST && { staffId }),
      });
      showResultToast(
        res,
        `Booked ${name.trim() || "the customer"} for ${formatTime12(chosen?.time)}`,
        "Failed to book",
      );
      if (res.success) onOpenChange(false);
    });
  };

  const empty = options.length === 0;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New booking"
      description={`${dayLabel} · for a customer at the desk or on the phone`}
      className="sm:max-w-xl"
      footer={
        empty ? (
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="walk-in-form" loading={pending} disabled={!slot}>
              {chosen ? `Book ${formatTime12(chosen.time)}` : "Pick a time"}
            </Button>
          </>
        )
      }
    >
      {empty ? (
        <EmptyState
          icon={CalendarX2}
          title="No free times left"
          description="Every open slot on this day is booked or has started. Open more times on the Slots page."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/slots">Go to Slots</Link>
            </Button>
          }
        />
      ) : (
        <form id="walk-in-form" onSubmit={submit} className="space-y-6">
          <section className="space-y-4" aria-labelledby="walk-in-step-1">
            <StepTitle n={1} id="walk-in-step-1" icon={Scissors}>
              Service and time
            </StepTitle>
            <div className="space-y-1.5">
              <Label htmlFor="walk-in-service">Service</Label>
              <Select value={serviceKey} onValueChange={pickService}>
                <SelectTrigger id="walk-in-service" className="w-full">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {s.count} {s.count === 1 ? "time" : "times"} free
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-2">
              <legend className="flex w-full items-center justify-between text-sm font-medium">
                <span>Time</span>
                {service?.durationMin ? (
                  <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {durationLabel(service.durationMin)}
                  </span>
                ) : null}
              </legend>
              {times.length === 0 ? (
                <p className="rounded-xl bg-surface-subtle px-3 py-2.5 text-sm text-muted-foreground">
                  No free times left for this service.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {times.map((o) => {
                    const selected = o.start === start;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setStart(o.start)}
                        className={cn(
                          "h-10 rounded-full border text-sm font-medium tabular-nums transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface text-foreground hover:border-success/60 hover:bg-success-soft",
                        )}
                      >
                        {formatTime12(o.time)}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </section>

          <section className="space-y-4" aria-labelledby="walk-in-step-2">
            <StepTitle n={2} id="walk-in-step-2" icon={UserRound}>
              Customer
            </StepTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="walk-in-name">Name</Label>
                <Input
                  id="walk-in-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="walk-in-phone">Phone</Label>
                <Input
                  id="walk-in-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="01XXXXXXXXX"
                  autoComplete="off"
                />
              </div>
            </div>
            {stylists.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="walk-in-stylist">Stylist (optional)</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger id="walk-in-stylist" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_STYLIST}>No preference</SelectItem>
                    {stylists.map((s) => {
                      const off = slot ? isOff(s, slot) : false;
                      return (
                        <SelectItem key={s.id} value={s.id} disabled={off}>
                          {off ? `${s.name} · off then` : s.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="walk-in-notes">Notes (optional)</Label>
              <Input id="walk-in-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </div>
          </section>
        </form>
      )}
    </ResponsiveDialog>
  );
}

function StepTitle({
  n,
  id,
  icon: Icon,
  children,
}: {
  n: number;
  id: string;
  icon: typeof Scissors;
  children: React.ReactNode;
}) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="grid size-6 place-items-center rounded-full bg-primary-soft text-xs text-primary-hover tabular-nums">
        {n}
      </span>
      {children}
      <Icon aria-hidden="true" className="ml-auto size-4 text-muted-foreground" />
    </h3>
  );
}
