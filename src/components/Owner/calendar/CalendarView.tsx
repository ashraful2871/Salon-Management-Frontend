"use client";

import { runsBranch } from "@/lib/owner-access";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutGrid,
  Plus,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatCard } from "@/components/Shared/StatCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import type { Appointment } from "@/lib/api-types";
import { TONE_CLASSES, toneOf } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { toAppointmentRow, type AppointmentRow } from "@/components/Dashboard/appointments/AppointmentRow";
import { useAppointmentActions, type AppointmentActions } from "@/components/Dashboard/appointments/useAppointmentActions";
import { useBookingDialogs } from "@/components/Dashboard/appointments/useBookingDialogs";
import { formatDay, formatTime12 } from "@/components/Dashboard/appointments/format";
import { humanizeStatus } from "@/components/Shared/ToneBadge";
import type { CalendarData, CalendarOffRange, CalendarResource } from "@/services/appoinments/calendar-types";
import { BookingSheet } from "./BookingSheet";
import { WalkInDialog, type WalkInStart } from "./WalkInDialog";
import { AvailabilityPanel } from "./AvailabilityPanel";
import {
  daySummaries,
  freeOptions,
  initialsOf,
  notStarted,
  type DaySummary,
  type FreeOption,
} from "./availability";
import {
  PX_PER_MIN,
  addDay,
  dayOfStamp,
  dhakaNow,
  gridBounds,
  hhmmLabel,
  minutesOf,
  place,
  type Placed,
} from "./calendar-grid";

type Props = {
  /** Always the whole week (Mon–Sun) around `date`; the day view filters it. */
  data: CalendarData;
  /** The day's full bookings (day view only), for the desk dialogs. */
  appointments: Appointment[];
  role: string;
  date: string;
  view: "day" | "week";
  today: string;
  nowHHmm: string;
  openId?: string;
  /** `?book=1`: open "New booking" on arrival (the week view's button). */
  openBook?: boolean;
};

type Pane = "schedule" | "available";

const OPEN_LANE = "__open";
const UNASSIGNED = "unassigned";
const DONE = new Set(["COMPLETED", "NO_SHOW"]);
const IN_SALON = new Set(["CHECKED_IN", "IN_PROGRESS"]);

const hrefOf = (d: string, v: "day" | "week") => `/dashboard/calendar?view=${v}&date=${d}`;
const weekDays = (from: string) => Array.from({ length: 7 }, (_, i) => addDay(from, i));

/** One branch's calendar: toolbar, then the day or the week. */
export function CalendarView(props: Props) {
  // Lives above the day views so a phone stays on "Available" across days.
  const [pane, setPane] = useState<Pane>("schedule");

  if (props.view === "week") return <WeekView {...props} />;
  return props.date === props.today ? (
    <LiveDay key={props.date} {...props} pane={pane} setPane={setPane} />
  ) : (
    <StaticDay key={props.date} {...props} pane={pane} setPane={setPane} />
  );
}

/* ---------- Toolbar ---------- */

const toLocalDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toYmd = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

function Toolbar({
  view,
  date,
  today,
  from,
  to,
  action,
}: {
  view: "day" | "week";
  date: string;
  today: string;
  from: string;
  to: string;
  action?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const step = view === "week" ? 7 : 1;
  const base = view === "week" ? from : date;
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  const label =
    view === "week"
      ? `${formatDay(from)} – ${formatDay(to, !sameYear)}`
      : date === today
        ? `Today, ${formatDay(date)}`
        : formatDay(date, !sameYear);
  const onToday = view === "week" ? today >= from && today <= to : date === today;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
        <div
          role="group"
          aria-label={view === "week" ? "Week" : "Day"}
          className="flex min-w-0 flex-1 items-center justify-between rounded-full border border-border bg-surface sm:flex-none"
        >
          <Button asChild variant="ghost" size="icon-sm" aria-label={view === "week" ? "Previous week" : "Previous day"}>
            <Link href={hrefOf(addDay(base, -step), view)}>
              <ChevronLeft aria-hidden="true" />
            </Link>
          </Button>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-0 px-3 font-semibold tabular-nums sm:min-w-44"
                aria-label={`${label}, pick a date`}
              >
                <CalendarDays aria-hidden="true" className="text-muted-foreground" />
                <span className="truncate">{label}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" collisionPadding={16} className="w-auto rounded-2xl border-border bg-surface p-0">
              <Calendar
                mode="single"
                selected={toLocalDate(date)}
                defaultMonth={toLocalDate(date)}
                weekStartsOn={1}
                onSelect={(day) => {
                  if (!day) return;
                  setOpen(false);
                  router.push(hrefOf(toYmd(day), view));
                }}
                autoFocus
                className="rounded-2xl bg-surface [--cell-size:--spacing(9)] pointer-coarse:[--cell-size:--spacing(10)]"
              />
            </PopoverContent>
          </Popover>
          <Button asChild variant="ghost" size="icon-sm" aria-label={view === "week" ? "Next week" : "Next day"}>
            <Link href={hrefOf(addDay(base, step), view)}>
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-current={onToday ? "date" : undefined}
          className={cn("shrink-0", onToday && "border-primary/40 bg-primary-soft text-primary-hover")}
        >
          <Link href={hrefOf(today, view)}>Today</Link>
        </Button>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="flex flex-1 rounded-full border border-border bg-surface p-0.5 sm:flex-none" role="group" aria-label="View">
          {(["day", "week"] as const).map((v) => (
            <Link
              key={v}
              href={hrefOf(date, v)}
              aria-current={v === view ? "page" : undefined}
              className={cn(
                "flex-1 rounded-full px-4 py-1.5 text-center text-sm font-medium transition-colors",
                v === view
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "day" ? "Day" : "Week"}
            </Link>
          ))}
        </div>
        {action}
      </div>
    </div>
  );
}

/* ---------- Week strip (day view) ---------- */

function WeekStrip({
  summaries,
  date,
  today,
  showFree,
}: {
  summaries: DaySummary[];
  date: string;
  today: string;
  showFree: boolean;
}) {
  return (
    <nav aria-label="Days of this week">
      <ol className="grid grid-cols-7 gap-1 sm:gap-2">
        {summaries.map((s) => {
          const selected = s.day === date;
          const isToday = s.day === today;
          const past = s.day < today;
          const [weekday, dayNum] = formatDay(s.day).split(" ");
          const status = s.closed
            ? "Closed"
            : showFree && !past
              ? s.free > 0
                ? `${s.free} free`
                : "Full"
              : s.booked > 0
                ? `${s.booked} booked`
                : "—";
          return (
            <li key={s.day} className="min-w-0">
              <Link
                href={hrefOf(s.day, "day")}
                aria-current={selected ? "date" : undefined}
                aria-label={`${formatDay(s.day)}${isToday ? ", today" : ""}: ${s.booked} booked${showFree && !past ? `, ${s.free} free` : ""}${s.closed ? ", closed" : ""}`}
                className={cn(
                  "flex flex-col items-center rounded-2xl border px-1 py-2 text-center transition-colors sm:items-start sm:px-3 sm:text-left",
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-surface-subtle",
                  past && !selected && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wide",
                    isToday ? "text-primary-hover" : "text-muted-foreground",
                  )}
                >
                  {isToday ? (
                    <>
                      <span className="sm:hidden">{weekday}</span>
                      <span className="hidden sm:inline">Today</span>
                    </>
                  ) : (
                    weekday
                  )}
                </span>
                <span className="font-display text-lg leading-tight font-semibold text-foreground tabular-nums sm:text-xl">
                  {dayNum}
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      s.closed
                        ? "bg-muted-foreground/40"
                        : showFree && !past
                          ? s.free > 0
                            ? "bg-success"
                            : "bg-danger"
                          : s.booked > 0
                            ? "bg-info"
                            : "bg-muted-foreground/40",
                    )}
                  />
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">{status}</span>
                </span>
                {s.booked > 0 && showFree && !past && !s.closed && (
                  <span className="hidden text-[11px] text-muted-foreground lg:inline">{s.booked} booked</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- Day view ---------- */

type DayProps = Props & { pane: Pane; setPane: (p: Pane) => void };

// Only today's day view polls (the desk queue); other days are read once.
function LiveDay(props: DayProps) {
  const actions = useAppointmentActions();
  const { queue } = useLiveQueue(props.appointments, 20_000, actions.pendingId !== null);
  return <DayView {...props} list={queue} actions={actions} />;
}

function StaticDay(props: DayProps) {
  const actions = useAppointmentActions();
  return <DayView {...props} list={props.appointments} actions={actions} />;
}

type DayItem =
  | { kind: "booking"; id: string; start: string; end: string; row: AppointmentRow }
  | { kind: "free"; id: string; start: string; end: string; options: FreeOption[] }
  | { kind: "blocked"; id: string; start: string; end: string; reason: string };

const endOf = (a: Appointment) => {
  if (a.endTime) return a.endTime;
  const s = minutesOf(a.startTime) ?? 0;
  const e = s + (a.service?.duration ?? 30);
  return `${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
};

/** Minutes of `range` inside the grid, for "off all day". */
const coveredMin = (ranges: CalendarOffRange[], bounds: { start: number; end: number }) =>
  ranges.reduce((sum, r) => {
    const s = Math.max(minutesOf(r.start) ?? bounds.start, bounds.start);
    const e = Math.min(minutesOf(r.end) ?? bounds.end, bounds.end);
    return sum + Math.max(e - s, 0);
  }, 0);

function DayView({
  data,
  list,
  actions,
  role,
  date,
  today,
  nowHHmm,
  openId,
  openBook,
  pane,
  setPane,
}: DayProps & { list: Appointment[]; actions: AppointmentActions }) {
  const [nowMs] = useState(() => Date.now());
  const nowMin = useNowMinutes(nowHHmm);
  const readOnly = data.readOnly || !runsBranch(role);
  const isPastDay = date < today;
  const isToday = date === today;
  const canBook = !readOnly && !isPastDay;
  const dayLabel = formatDay(date);

  const rows = actions
    .withPending(list)
    .filter((a) => a.status !== "CANCELLED")
    .map((a) => toAppointmentRow(a, nowMs, today));
  const dialogs = useBookingDialogs({ actions, rows });
  const [sheetId, setSheetId] = useState<string | null>(openId ?? null);
  const [sheetOpen, setSheetOpen] = useState(!!openId);
  const [walkIn, setWalkIn] = useState<{ key: number; initial: WalkInStart; open: boolean }>({
    key: 0,
    initial: null,
    open: !!openBook && canBook,
  });
  const sheetRow = rows.find((r) => r.id === sheetId) ?? null;

  // Free slots of this day that haven't started: the grid's free blocks, the
  // Available panel, "New booking" and Move all read this one list.
  const free = useMemo(
    () => data.openSlots.filter((s) => dayOfStamp(s.start) === date && notStarted(s.start, date, today, nowMin)),
    [data.openSlots, date, today, nowMin],
  );
  const options = useMemo(() => (canBook ? freeOptions(free) : []), [free, canBook]);

  const summaries = daySummaries(data, weekDays(data.from), today, nowMin, (d) => (d === date ? rows.length : undefined));
  const hours = data.hours.find((h) => h.day === date);

  const known = new Set(data.resources.map((r) => r.id));
  const resourceOf = (a: Appointment) => {
    const id = data.mode === "STAFF" ? a.staff?.id : a.counter?.id;
    return id && known.has(id) ? id : UNASSIGNED;
  };

  // Free slots at the same time in one column collapse into one block; it ends
  // with the shortest of them so the next time's block never overlaps it.
  const freeBlocks: Array<DayItem & { col: string }> = [];
  if (canBook) {
    const groups = new Map<string, typeof free>();
    for (const slot of free) {
      const key = `${slot.resourceId ?? OPEN_LANE}|${slot.start}`;
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    for (const [key, slots] of groups) {
      const [col, start] = key.split("|");
      const end = slots.map((s) => s.end).sort()[0];
      freeBlocks.push({ kind: "free", id: `free-${key}`, col, start, end, options: freeOptions(slots) });
    }
  }

  const items: Array<DayItem & { col: string }> = [
    ...rows.map((row) => ({
      kind: "booking" as const,
      id: row.id,
      col: resourceOf(row.raw),
      start: row.raw.startTime,
      end: endOf(row.raw),
      row,
    })),
    ...freeBlocks,
    ...data.blocked
      .filter((b) => dayOfStamp(b.start) === date)
      .map((b, i) => ({
        kind: "blocked" as const,
        id: `blocked-${i}`,
        col: b.resourceId ?? OPEN_LANE,
        start: b.start,
        end: b.end,
        reason: b.reason,
      })),
  ];

  const bounds = gridBounds(hours ? [hours] : [], items);
  const offOf = (col: string) =>
    (data.resources.find((r) => r.id === col)?.off ?? []).filter((o) => dayOfStamp(o.start) === date);
  const stylists =
    data.mode === "STAFF" ? data.resources.filter((r) => r.kind === "STAFF" && r.id !== UNASSIGNED) : [];

  const countIn = (col: string) => items.filter((i) => i.col === col && i.kind === "booking").length;
  const freeIn = (col: string) =>
    items.filter((i) => i.col === col && i.kind === "free").reduce((n, i) => n + (i.kind === "free" ? i.options.length : 0), 0);

  const resourceHead = (r: CalendarResource) => {
    const off = offOf(r.id);
    const span = bounds.end - bounds.start;
    const allDay = r.kind === "STAFF" && off.length > 0 && coveredMin(off, bounds) >= span;
    const onLeave = allDay && off.some((o) => o.kind === "LEAVE");
    const n = countIn(r.id);
    const f = data.mode === "COUNTER" ? freeIn(r.id) : 0;
    const meta = allDay
      ? onLeave
        ? "On leave"
        : "Off today"
      : [n ? `${n} booked` : "No bookings", f ? `${f} free` : ""].filter(Boolean).join(" · ");
    return (
      <ColumnHead
        name={r.name}
        meta={meta}
        badge={
          r.kind === "COUNTER" ? (
            <IconBadge icon={LayoutGrid} className="bg-info-soft text-info" />
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                allDay ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary-hover",
              )}
            >
              {initialsOf(r.name)}
            </span>
          )
        }
        muted={allDay}
      />
    );
  };

  const columns: Array<{ key: string; label: ReactNode }> = [
    ...(items.some((i) => i.col === OPEN_LANE)
      ? [
          {
            key: OPEN_LANE,
            label: (
              <ColumnHead
                name="Available"
                meta={canBook ? `${freeIn(OPEN_LANE)} free · tap to book` : "Blocked times"}
                badge={<IconBadge icon={CalendarPlus} className="bg-success-soft text-success" />}
              />
            ),
          },
        ]
      : []),
    ...data.resources.filter((r) => r.id !== UNASSIGNED).map((r) => ({ key: r.id, label: resourceHead(r) })),
    ...(items.some((i) => i.col === UNASSIGNED)
      ? [
          {
            key: UNASSIGNED,
            label: (
              <ColumnHead
                name="Unassigned"
                meta={`${countIn(UNASSIGNED)} need a stylist`}
                badge={<IconBadge icon={UserX} className="bg-warning-soft text-warning" />}
              />
            ),
          },
        ]
      : []),
  ];

  const openSheet = (id: string) => {
    setSheetId(id);
    setSheetOpen(true);
  };
  const openWalkIn = (initial: WalkInStart) => setWalkIn((w) => ({ key: w.key + 1, initial, open: true }));
  const moveSlots = sheetRow
    ? free.filter((s) => s.serviceId === sheetRow.raw.service?.id && dayOfStamp(s.start) === sheetRow.date)
    : [];

  // Day figures, read off the live list.
  const inSalon = rows.filter((r) => IN_SALON.has(r.status)).length;
  const completed = rows.filter((r) => r.status === "COMPLETED").length;
  const noShows = rows.filter((r) => r.status === "NO_SHOW").length;
  const pendingCount = rows.filter((r) => r.status === "PENDING").length;
  const toCome = rows.filter((r) => !DONE.has(r.status) && !IN_SALON.has(r.status)).length;

  const newBooking = canBook ? (
    <Button size="sm" className="shrink-0" onClick={() => openWalkIn(null)}>
      <Plus aria-hidden="true" />
      New booking
    </Button>
  ) : null;

  return (
    <div className="min-w-0 space-y-4">
      <Toolbar view="day" date={date} today={today} from={data.from} to={data.to} action={newBooking} />
      <WeekStrip summaries={summaries} date={date} today={today} showFree={!readOnly} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Booked"
          value={rows.length}
          icon={CalendarCheck}
          tone="info"
          hint={pendingCount ? `${pendingCount} waiting for a stylist` : `${toCome} still to come`}
        />
        {readOnly ? (
          <StatCard label="Still to come" value={toCome} icon={CalendarDays} tone="warning" hint="Pending or confirmed" />
        ) : (
          <StatCard
            label="Free times"
            value={options.length}
            icon={CalendarPlus}
            tone="success"
            hint={
              isPastDay
                ? "This day has passed"
                : options[0]
                  ? `Next free at ${formatTime12(options[0].time)}`
                  : "Fully booked"
            }
          />
        )}
        <StatCard label="In the salon" value={inSalon} icon={Armchair} tone="primary" hint="Checked in or in the chair" />
        <StatCard
          label="Completed"
          value={completed}
          icon={CheckCircle2}
          tone="success"
          hint={noShows ? `${noShows} no-show${noShows === 1 ? "" : "s"}` : isToday ? "So far today" : undefined}
        />
      </div>

      {hours?.closed && (
        <p className="flex items-start gap-2 rounded-2xl border border-info/20 bg-info-soft px-4 py-3 text-sm text-info">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          The salon is closed on this day according to its opening hours.
        </p>
      )}

      {!readOnly && (
        <div role="tablist" aria-label="Show" className="flex rounded-full border border-border bg-surface p-0.5 xl:hidden">
          {(
            [
              ["schedule", "Schedule"],
              ["available", `Available times (${options.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={pane === value}
              onClick={() => setPane(value)}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                pane === value ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className={cn("grid gap-4", !readOnly && "xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]")}>
        <div className={cn("min-w-0 space-y-3", !readOnly && pane === "available" && "max-xl:hidden")}>
          {columns.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface">
              <EmptyState
                icon={CalendarDays}
                title="Nothing on this day"
                description="Add stylists or counters and open slots, and they will show up here by time."
                action={
                  !readOnly ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/slots">Open slots</Link>
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <Frame
              columns={columns}
              bounds={bounds}
              nowMin={isToday ? nowMin : null}
              scrollToMin={isToday ? nowMin - 60 : null}
              render={(key) => (
                <>
                  {offOf(key).map((o, i) => (
                    <OffBand key={`off-${i}`} range={o} bounds={bounds} />
                  ))}
                  {place(
                    items.filter((i) => i.col === key),
                    bounds.start,
                  ).map((p) => (
                    <DayBlock
                      key={p.id}
                      item={p}
                      pending={p.kind === "booking" && actions.isPending(p.id)}
                      onBooking={openSheet}
                      onFree={(o) => openWalkIn({ start: o[0]?.start, serviceKey: o[0]?.serviceKey })}
                    />
                  ))}
                </>
              )}
            />
          )}
          <Legend showFree={canBook} />
        </div>

        {!readOnly && (
          <AvailabilityPanel
            options={options}
            isPastDay={isPastDay}
            dayLabel={dayLabel}
            onPick={(o) => openWalkIn({ start: o.start, serviceKey: o.serviceKey })}
            className={cn(pane === "schedule" && "max-xl:hidden", "xl:max-h-[calc(100dvh-9rem)]")}
          />
        )}
      </div>

      <BookingSheet
        row={sheetRow}
        open={sheetOpen && !!sheetRow}
        onOpenChange={setSheetOpen}
        role={role}
        readOnly={readOnly}
        actions={actions}
        freeSlots={moveSlots}
        onAssign={(r) => {
          setSheetOpen(false);
          dialogs.openAssign(r);
        }}
        onCancel={(r) => {
          setSheetOpen(false);
          dialogs.openCancel(r);
        }}
        onView={(r) => {
          setSheetOpen(false);
          dialogs.openView(r);
        }}
      />
      {canBook && (
        <WalkInDialog
          key={walkIn.key}
          options={options}
          initial={walkIn.initial}
          open={walkIn.open}
          onOpenChange={(open) => setWalkIn((w) => ({ ...w, open }))}
          stylists={stylists}
          dayLabel={formatDay(date, true)}
        />
      )}
      {dialogs.dialogs}
    </div>
  );
}

function IconBadge({ icon: Icon, className }: { icon: typeof Plus; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full", className)}>
      <Icon className="size-4" />
    </span>
  );
}

function ColumnHead({
  name,
  meta,
  badge,
  muted = false,
}: {
  name: string;
  meta: string;
  badge: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", muted && "opacity-70")}>
      {badge}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs font-normal text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

/** A stretch a stylist can't be booked: hatched, under the blocks, never clickable. */
function OffBand({ range, bounds }: { range: CalendarOffRange; bounds: { start: number; end: number } }) {
  const s = Math.max(minutesOf(range.start) ?? bounds.start, bounds.start);
  const e = Math.min(minutesOf(range.end) ?? bounds.end, bounds.end);
  if (e <= s) return null;
  const label = range.kind === "LEAVE" ? (range.reason ? `Time off · ${range.reason}` : "Time off") : "Not working";
  return (
    <div
      className={cn(HATCH, "pointer-events-none absolute inset-x-0 overflow-hidden bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground")}
      style={{ top: (s - bounds.start) * PX_PER_MIN, height: (e - s) * PX_PER_MIN }}
      title={label}
    >
      {(e - s) * PX_PER_MIN >= 18 && <span className="truncate">{label}</span>}
    </div>
  );
}

const HATCH = "[background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgb(0_0_0/0.05)_6px_12px)]";

const laneStyle = (p: Placed<object>): CSSProperties => ({
  top: p.top,
  height: p.height,
  left: `calc(${(p.lane / p.lanes) * 100}% + 3px)`,
  width: `calc(${100 / p.lanes}% - 6px)`,
});

const clock = (stamp: string) => formatTime12(stamp.slice(-5));

function DayBlock({
  item,
  pending,
  onBooking,
  onFree,
}: {
  item: Placed<DayItem>;
  pending: boolean;
  onBooking: (id: string) => void;
  onFree: (options: FreeOption[]) => void;
}) {
  if (item.kind === "blocked") {
    return (
      <div
        className={cn(HATCH, "absolute flex items-start rounded-lg border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground")}
        style={laneStyle(item)}
        title={`${item.reason} · ${clock(item.start)} – ${clock(item.end)}`}
      >
        <span className="truncate">{item.reason}</span>
      </div>
    );
  }

  if (item.kind === "free") {
    const names = item.options.map((o) => o.serviceName);
    const title = names.length === 1 ? names[0] : `${names.length} services`;
    const roomy = item.height >= 38;
    return (
      <button
        type="button"
        onClick={() => onFree(item.options)}
        className="group absolute flex items-start gap-1.5 overflow-hidden rounded-lg border border-dashed border-success/45 bg-success-soft/30 px-2 py-1 text-left text-xs text-success transition-colors hover:border-success hover:bg-success-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        style={laneStyle(item)}
        title={`Free at ${clock(item.start)}: ${names.join(", ")}`}
        aria-label={`Book at ${clock(item.start)}: ${names.join(", ")}`}
      >
        <span className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-success text-white">
          <Plus aria-hidden="true" className="size-3" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            {clock(item.start)} · {title}
          </span>
          {roomy && names.length > 1 && (
            <span className="block truncate text-success/80">{names.join(", ")}</span>
          )}
        </span>
      </button>
    );
  }

  const { row } = item;
  const tone = TONE_CLASSES[toneOf(row.status)];
  const done = DONE.has(row.status);
  const lines = item.height >= 58 ? 3 : item.height >= 36 ? 2 : 1;
  return (
    <button
      type="button"
      onClick={() => onBooking(row.id)}
      className={cn(
        "absolute overflow-hidden rounded-lg border border-black/5 bg-surface py-1 pr-2 pl-3 text-left text-xs shadow-xs transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        done && "opacity-65",
        pending && "opacity-50",
      )}
      style={laneStyle(item)}
      aria-label={`${row.time}, ${row.customer}, ${row.service}, ${humanizeStatus(row.status)}`}
    >
      <span className={cn("absolute inset-0", tone.soft, "opacity-60")} aria-hidden="true" />
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.dot)} aria-hidden="true" />
      <span className="relative block">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-foreground">
            {row.serial !== null && <span className="text-muted-foreground">#{row.serial} </span>}
            {row.customer}
          </span>
          {lines === 1 && <span className="shrink-0 text-muted-foreground tabular-nums">{clock(item.start)}</span>}
        </span>
        {lines >= 2 && (
          <span className="block truncate text-muted-foreground">
            <span className="tabular-nums">
              {clock(item.start)} – {clock(item.end)}
            </span>{" "}
            · {row.service}
          </span>
        )}
        {lines >= 3 && (
          <span className={cn("mt-0.5 flex items-center gap-1 truncate font-medium", tone.text)}>
            <span className={cn("size-1.5 shrink-0 rounded-full", tone.dot)} aria-hidden="true" />
            {humanizeStatus(row.status)}
            {row.staffName && <span className="truncate font-normal text-muted-foreground">· {row.staffName}</span>}
          </span>
        )}
      </span>
    </button>
  );
}

/* ---------- Legend ---------- */

const LEGEND_STATUSES = [
  ["PENDING", "Pending"],
  ["CONFIRMED", "Confirmed"],
  ["CHECKED_IN", "In the salon"],
  ["COMPLETED", "Completed"],
  ["NO_SHOW", "No-show"],
] as const;

function Legend({ showFree }: { showFree: boolean }) {
  return (
    <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
      {LEGEND_STATUSES.map(([status, label]) => (
        <li key={status} className="flex items-center gap-1.5">
          <span className={cn("h-3 w-1 rounded-full", TONE_CLASSES[toneOf(status)].dot)} aria-hidden="true" />
          {label}
        </li>
      ))}
      {showFree && (
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-dashed border-success bg-success-soft/50" aria-hidden="true" />
          Free – tap to book
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <span className={cn(HATCH, "size-3 rounded border border-border bg-muted")} aria-hidden="true" />
        Blocked or not working
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-3 rounded-full bg-danger" aria-hidden="true" />
        Now
      </li>
    </ul>
  );
}

/* ---------- Week view ---------- */

function WeekView({ data, date, today, nowHHmm, role }: Props) {
  const nowMin = useNowMinutes(nowHHmm);
  const days = weekDays(data.from);
  const readOnly = data.readOnly || !runsBranch(role);
  const summaries = daySummaries(data, days, today, nowMin);
  const bounds = gridBounds(data.hours, data.bookings);
  const bookDay = date >= today ? date : today;

  const totalBooked = summaries.reduce((n, s) => n + s.booked, 0);
  const totalFree = summaries.reduce((n, s) => n + s.free, 0);
  const busiest = [...summaries].sort((a, b) => b.booked - a.booked)[0];
  const openDays = summaries.filter((s) => !s.closed && s.day >= today && s.free > 0).length;

  return (
    <div className="min-w-0 space-y-4">
      <Toolbar
        view="week"
        date={date}
        today={today}
        from={data.from}
        to={data.to}
        action={
          readOnly ? null : (
            <Button asChild size="sm" className="shrink-0">
              <Link href={`/dashboard/calendar?view=day&date=${bookDay}&book=1`}>
                <Plus aria-hidden="true" />
                New booking
              </Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Booked this week" value={totalBooked} icon={CalendarCheck} tone="info" />
        {readOnly ? (
          <StatCard label="Days with bookings" value={summaries.filter((s) => s.booked > 0).length} icon={CalendarDays} tone="warning" />
        ) : (
          <StatCard label="Free times left" value={totalFree} icon={CalendarPlus} tone="success" hint="From now on" />
        )}
        <StatCard
          label="Busiest day"
          value={busiest && busiest.booked > 0 ? formatDay(busiest.day).split(" ")[0] : "—"}
          icon={UserCheck}
          tone="primary"
          hint={busiest && busiest.booked > 0 ? `${busiest.booked} booked` : undefined}
        />
        <StatCard
          label={readOnly ? "Closed days" : "Days with free times"}
          value={readOnly ? summaries.filter((s) => s.closed).length : openDays}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <Frame
        columns={summaries.map((s) => {
          const past = s.day < today;
          const meta = s.closed
            ? "Closed"
            : [s.booked ? `${s.booked} booked` : "No bookings", !readOnly && !past && s.free ? `${s.free} free` : ""]
                .filter(Boolean)
                .join(" · ");
          const [weekday, dayNum] = formatDay(s.day).split(" ");
          return {
            key: s.day,
            label: (
              <Link
                href={hrefOf(s.day, "day")}
                className={cn("flex min-w-0 items-center gap-2 rounded-lg hover:text-primary-hover", past && "opacity-60")}
                aria-label={`Open ${formatDay(s.day)}`}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-semibold tabular-nums",
                    s.day === today ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-foreground",
                  )}
                >
                  {dayNum}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{weekday}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground">{meta}</span>
                </span>
              </Link>
            ),
          };
        })}
        bounds={bounds}
        nowMin={days.includes(today) ? nowMin : null}
        nowColumn={today}
        scrollToMin={days.includes(today) ? nowMin - 60 : null}
        selectedColumn={date}
        compact
        render={(day) =>
          place(
            data.bookings.filter((b) => dayOfStamp(b.start) === day && b.status !== "CANCELLED"),
            bounds.start,
          ).map((b) => {
            const tone = TONE_CLASSES[toneOf(b.status)];
            return (
              <Link
                key={b.id}
                href={`/dashboard/calendar?view=day&date=${day}&open=${b.id}`}
                className={cn(
                  "absolute overflow-hidden rounded-md border border-black/5 bg-surface py-0.5 pr-1 pl-2 text-[11px] leading-tight shadow-xs hover:shadow-md",
                  DONE.has(b.status) && "opacity-65",
                )}
                style={laneStyle(b)}
                aria-label={`${clock(b.start)}, ${b.customerName}, ${b.serviceName}, ${humanizeStatus(b.status)}`}
              >
                <span className={cn("absolute inset-0 opacity-60", tone.soft)} aria-hidden="true" />
                <span className={cn("absolute inset-y-0 left-0 w-0.5", tone.dot)} aria-hidden="true" />
                <span className="relative block truncate font-semibold text-foreground">{b.customerName}</span>
                {b.height >= 30 && (
                  <span className="relative block truncate text-muted-foreground">
                    {clock(b.start)} · {b.serviceName}
                  </span>
                )}
              </Link>
            );
          })
        }
      />
      <Legend showFree={false} />
    </div>
  );
}

/* ---------- Shared frame ---------- */

/** The minute of the day in Dhaka, ticking once a minute. */
function useNowMinutes(initial: string) {
  const [now, setNow] = useState(() => minutesOf(initial) ?? 0);
  useEffect(() => {
    const id = setInterval(() => setNow(minutesOf(dhakaNow()) ?? 0), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The scrolling frame: sticky column header, sticky time column, 15-minute
 * rows. It scrolls both ways inside itself, so the page never scrolls
 * sideways. On today it opens scrolled to just before now, with the time
 * already gone shaded.
 */
function Frame({
  columns,
  bounds,
  nowMin,
  nowColumn,
  selectedColumn,
  scrollToMin,
  compact = false,
  render,
}: {
  columns: Array<{ key: string; label: ReactNode }>;
  bounds: { start: number; end: number };
  nowMin: number | null;
  /** Week view: the now line only crosses today's column. */
  nowColumn?: string;
  selectedColumn?: string;
  scrollToMin?: number | null;
  compact?: boolean;
  render: (key: string) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const height = (bounds.end - bounds.start) * PX_PER_MIN;
  const hours = Array.from({ length: (bounds.end - bounds.start) / 60 }, (_, i) => bounds.start + i * 60);
  const showNow = nowMin !== null && nowMin >= bounds.start && nowMin <= bounds.end;
  const nowTop = showNow ? (nowMin - bounds.start) * PX_PER_MIN : 0;
  const pastTop = nowMin === null ? 0 : Math.min(Math.max((nowMin - bounds.start) * PX_PER_MIN, 0), height);
  const lines: CSSProperties = {
    height,
    backgroundImage:
      "linear-gradient(to bottom, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-border) 40%, transparent) 1px, transparent 1px)",
    backgroundSize: `100% ${60 * PX_PER_MIN}px, 100% ${30 * PX_PER_MIN}px`,
  };

  // Once, on arrival: start at the part of the day that matters now.
  const scrollTarget = scrollToMin == null ? null : Math.max((scrollToMin - bounds.start) * PX_PER_MIN, 0);
  useEffect(() => {
    if (scrollTarget !== null && ref.current) ref.current.scrollTop = scrollTarget;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="max-h-[calc(100dvh-9rem)] min-h-96 overflow-auto rounded-2xl border border-border bg-surface shadow-xs"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `4rem repeat(${columns.length}, minmax(${compact ? "8.5rem" : "11rem"}, 1fr))`,
        }}
      >
        <div className="sticky top-0 left-0 z-30 border-r border-b border-border bg-surface" />
        {columns.map((c) => (
          <div
            key={c.key}
            className={cn(
              "sticky top-0 z-20 min-w-0 border-b border-l border-border bg-surface px-3 py-2.5",
              selectedColumn === c.key && "bg-primary-soft",
            )}
          >
            {c.label}
          </div>
        ))}

        <div className="sticky left-0 z-10 border-r border-border bg-surface" style={{ height }}>
          <div className="relative h-full">
            {hours.map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground tabular-nums first:translate-y-1"
                style={{ top: (h - bounds.start) * PX_PER_MIN }}
              >
                {hhmmLabel(h)}
              </span>
            ))}
            {showNow && (
              <span
                className="absolute right-1 z-10 -translate-y-1/2 rounded-full bg-danger px-1.5 py-px text-[10px] font-semibold text-white tabular-nums"
                style={{ top: nowTop }}
              >
                {formatTime12(`${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`).replace(" ", "")}
              </span>
            )}
          </div>
        </div>
        {columns.map((c) => {
          const nowHere = showNow && (!nowColumn || nowColumn === c.key);
          return (
            <div
              key={c.key}
              className={cn("relative border-l border-border", selectedColumn === c.key && "bg-primary-soft/20")}
              style={lines}
            >
              {nowMin !== null && (!nowColumn || nowColumn === c.key) && pastTop > 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-surface-subtle/70" style={{ height: pastTop }} aria-hidden="true" />
              )}
              {render(c.key)}
              {nowHere && (
                <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-danger" style={{ top: nowTop }} aria-hidden="true">
                  <span className="absolute -top-[3px] -left-[3px] size-2 rounded-full bg-danger" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
