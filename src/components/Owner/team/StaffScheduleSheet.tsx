"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarOff, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { getStaffSchedule } from "@/services/staff/getStaffSchedule";
import { addStaffTimeOff, deleteStaffTimeOff, saveStaffShifts } from "@/services/staff/scheduleActions";
import type { StaffShift, StaffTimeOff } from "@/services/staff/schedule-types";

// Monday first, like the calendar. Values are JS weekdays (0 = Sunday).
const DAYS = [
  { weekday: 1, label: "Monday" },
  { weekday: 2, label: "Tuesday" },
  { weekday: 3, label: "Wednesday" },
  { weekday: 4, label: "Thursday" },
  { weekday: 5, label: "Friday" },
  { weekday: 6, label: "Saturday" },
  { weekday: 0, label: "Sunday" },
];
const DEFAULT_START = "10:00";
const DEFAULT_END = "20:00";

type DayRow = { on: boolean; start: string; end: string };
type Week = Record<number, DayRow>;

/** One interval per day in this editor; split shifts load as first start → last end. */
const toWeek = (shifts: StaffShift[]): Week =>
  Object.fromEntries(
    DAYS.map(({ weekday }) => {
      const day = shifts.filter((s) => s.weekday === weekday);
      return [
        weekday,
        day.length
          ? {
              on: true,
              start: day.map((s) => s.startTime).sort()[0],
              end: day.map((s) => s.endTime).sort().reverse()[0],
            }
          : { on: false, start: DEFAULT_START, end: DEFAULT_END },
      ];
    }),
  );

const fromWeek = (week: Week): StaffShift[] =>
  DAYS.filter(({ weekday }) => week[weekday].on).map(({ weekday }) => ({
    weekday,
    startTime: week[weekday].start,
    endTime: week[weekday].end,
  }));

const dhaka = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const dhakaDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" });

/** "20 Oct 2026" for whole days, else with times. */
const describe = (t: StaffTimeOff) => {
  const s = new Date(t.startsAt);
  const e = new Date(t.endsAt);
  const midnight = (d: Date) => d.getTime() % 86_400_000 === 18 * 3_600_000; // 00:00 in Dhaka = 18:00 UTC
  if (midnight(s) && midnight(e)) {
    const last = new Date(e.getTime() - 86_400_000);
    const a = dhakaDate.format(s);
    const b = dhakaDate.format(last);
    return a === b ? a : `${a} – ${b}`;
  }
  return `${dhaka.format(s)} – ${dhaka.format(e)}`;
};

const todayDhaka = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
const nextDay = (day: string) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/**
 * A stylist's working week and time off. Without fixed hours a stylist can be
 * booked whenever the salon is open; time off always blocks them. Bookings
 * already made are never moved - adding time off reports how many clash.
 */
export function StaffScheduleSheet({
  staffId,
  name,
  open,
  onOpenChange,
}: {
  staffId: string | null;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loaded, setLoaded] = useState<{ id: string; fixed: boolean; week: Week; timeOff: StaffTimeOff[] } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !staffId) return;
    let live = true;
    getStaffSchedule(staffId).then((res) => {
      if (!live) return;
      if (res.success && res.data) {
        setError(null);
        setLoaded({
          id: staffId,
          fixed: res.data.hours.shifts.length > 0,
          week: toWeek(res.data.hours.shifts),
          timeOff: res.data.timeOff,
        });
      } else {
        setError(res.message || "Couldn't load working hours.");
      }
    });
    return () => {
      live = false;
    };
  }, [open, staffId]);

  const state = loaded && loaded.id === staffId ? loaded : null;
  const setDay = (weekday: number, patch: Partial<DayRow>) =>
    setLoaded((s) => s && { ...s, week: { ...s.week, [weekday]: { ...s.week[weekday], ...patch } } });

  const invalid =
    !!state?.fixed && DAYS.some(({ weekday }) => state.week[weekday].on && state.week[weekday].start >= state.week[weekday].end);

  const copyMonday = () =>
    setLoaded(
      (s) => s && { ...s, week: Object.fromEntries(DAYS.map(({ weekday }) => [weekday, { ...s.week[1] }])) as Week },
    );

  const save = () => {
    if (!state || !staffId) return;
    startSave(async () => {
      const res = await saveStaffShifts(staffId, state.fixed ? fromWeek(state.week) : []);
      showResultToast(res, "Working hours saved", "Couldn't save the hours");
      if (res.success && res.data) {
        const shifts = res.data.shifts;
        setLoaded((s) => s && { ...s, fixed: shifts.length > 0, week: toWeek(shifts) });
      }
    });
  };

  const remove = async (t: StaffTimeOff) => {
    if (!staffId) return;
    setRemoving(t.id);
    const res = await deleteStaffTimeOff(staffId, t.id);
    setRemoving(null);
    showResultToast(res, "Time off removed", "Couldn't remove the time off");
    if (res.success) setLoaded((s) => s && { ...s, timeOff: s.timeOff.filter((x) => x.id !== t.id) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>Hours · {name}</SheetTitle>
          <SheetDescription>
            When {name} can be booked. Nobody can be given a booking outside these hours or during time off.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
          {error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : !state ? (
            <div aria-busy="true" aria-label="Loading hours" className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <section className="space-y-3" aria-labelledby="hours-heading">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="hours-heading" className="text-sm font-semibold text-foreground">
                    Working hours
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    Fixed hours
                    <Switch
                      checked={state.fixed}
                      onCheckedChange={(fixed) => setLoaded((s) => s && { ...s, fixed })}
                      aria-label="Set fixed working hours"
                    />
                  </label>
                </div>

                {!state.fixed ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No fixed hours: {name} can be booked whenever the salon is open.
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {DAYS.map(({ weekday, label }) => {
                        const row = state.week[weekday];
                        const bad = row.on && row.start >= row.end;
                        return (
                          <li key={weekday} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                            <Switch
                              checked={row.on}
                              onCheckedChange={(on) => setDay(weekday, { on })}
                              aria-label={`Works on ${label}`}
                            />
                            <span className="w-24 text-sm font-medium text-foreground">{label}</span>
                            {row.on ? (
                              <span className="ml-auto flex items-center gap-1.5">
                                <Input
                                  type="time"
                                  value={row.start}
                                  onChange={(e) => setDay(weekday, { start: e.target.value })}
                                  aria-label={`${label} start`}
                                  aria-invalid={bad || undefined}
                                  className="h-9 w-[7.5rem]"
                                />
                                <span aria-hidden="true" className="text-muted-foreground">–</span>
                                <Input
                                  type="time"
                                  value={row.end}
                                  onChange={(e) => setDay(weekday, { end: e.target.value })}
                                  aria-label={`${label} end`}
                                  aria-invalid={bad || undefined}
                                  className="h-9 w-[7.5rem]"
                                />
                              </span>
                            ) : (
                              <span className="ml-auto text-sm text-muted-foreground">Off</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={copyMonday}>
                        <Copy />
                        Copy Monday to all
                      </Button>
                      {invalid && <p className="text-xs text-danger">Each day must end after it starts.</p>}
                    </div>
                  </>
                )}
              </section>

              <section className="space-y-3" aria-labelledby="timeoff-heading">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="timeoff-heading" className="text-sm font-semibold text-foreground">
                    Time off
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus />
                    Add time off
                  </Button>
                </div>
                {state.timeOff.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No time off planned.
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {state.timeOff.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                        <CalendarOff aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{describe(t)}</p>
                          {t.reason && <p className="truncate text-xs text-muted-foreground">{t.reason}</p>}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove time off ${describe(t)}`}
                          className="text-muted-foreground hover:text-danger"
                          disabled={removing === t.id}
                          onClick={() => remove(t)}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        <SheetFooter className="border-t border-border px-6 py-4">
          <Button onClick={save} loading={saving} disabled={!state || invalid}>
            Save hours
          </Button>
        </SheetFooter>

        {staffId && (
          <AddTimeOffDialog
            staffId={staffId}
            name={name}
            open={addOpen}
            onOpenChange={setAddOpen}
            onAdded={(t) =>
              setLoaded(
                (s) =>
                  s && { ...s, timeOff: [...s.timeOff, t].sort((a, b) => a.startsAt.localeCompare(b.startsAt)) },
              )
            }
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function AddTimeOffDialog({
  staffId,
  name,
  open,
  onOpenChange,
  onAdded,
}: {
  staffId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (t: StaffTimeOff) => void;
}) {
  const [fromDay, setFromDay] = useState(todayDhaka);
  const [toDay, setToDay] = useState(todayDhaka);
  const [wholeDays, setWholeDays] = useState(true);
  const [fromTime, setFromTime] = useState("10:00");
  const [toTime, setToTime] = useState("14:00");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const startsAt = `${fromDay}T${wholeDays ? "00:00" : fromTime}:00+06:00`;
  const endsAt = wholeDays ? `${nextDay(toDay)}T00:00:00+06:00` : `${toDay}T${toTime}:00+06:00`;
  const valid = !!fromDay && !!toDay && Date.parse(endsAt) > Date.parse(startsAt);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    startTransition(async () => {
      const res = await addStaffTimeOff(staffId, { startsAt, endsAt, reason: reason.trim() || undefined });
      if (!res.success || !res.data) {
        showResultToast(res, "", "Couldn't add the time off");
        return;
      }
      const clash = res.data.clashingBookings;
      if (clash > 0) {
        toast.warning(
          `Time off added. ${clash} booking${clash === 1 ? " is" : "s are"} already with ${name} then - reassign ${clash === 1 ? "it" : "them"} from Appointments.`,
        );
      } else {
        toast.success("Time off added");
      }
      onAdded(res.data);
      setReason("");
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add time off"
      description={`${name} can't be booked during this time.`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="time-off-form" loading={pending} disabled={!valid}>
            Add time off
          </Button>
        </>
      }
    >
      <form id="time-off-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="time-off-from">From</Label>
            <Input
              id="time-off-from"
              type="date"
              value={fromDay}
              onChange={(e) => {
                setFromDay(e.target.value);
                if (e.target.value > toDay) setToDay(e.target.value);
              }}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-off-to">To</Label>
            <Input
              id="time-off-to"
              type="date"
              value={toDay}
              min={fromDay}
              onChange={(e) => setToDay(e.target.value)}
              required
            />
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Whole days</span>
          <Switch checked={wholeDays} onCheckedChange={setWholeDays} aria-label="Whole days" />
        </label>
        {!wholeDays && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="time-off-from-time">Starts at</Label>
              <Input id="time-off-from-time" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time-off-to-time">Ends at</Label>
              <Input id="time-off-to-time" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="time-off-reason">Reason (optional)</Label>
          <Input
            id="time-off-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Leave, sick day, training…"
          />
        </div>
        {!valid && fromDay && toDay && <p className="text-xs text-danger">The end must be after the start.</p>}
      </form>
    </ResponsiveDialog>
  );
}
