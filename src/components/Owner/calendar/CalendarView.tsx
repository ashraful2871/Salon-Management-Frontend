"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/lib/api-types";
import { TONE_CLASSES, toneOf } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { useLiveQueue } from "@/hooks/useLiveQueue";
import { toAppointmentRow, type AppointmentRow } from "@/components/Dashboard/appointments/AppointmentRow";
import { useAppointmentActions, type AppointmentActions } from "@/components/Dashboard/appointments/useAppointmentActions";
import { useBookingDialogs } from "@/components/Dashboard/appointments/useBookingDialogs";
import { formatDay, formatTime12 } from "@/components/Dashboard/appointments/format";
import { humanizeStatus } from "@/components/Shared/ToneBadge";
import type { CalendarData, CalendarSlot } from "@/services/appoinments/calendar-types";
import { BookingSheet } from "./BookingSheet";
import { WalkInDialog } from "./WalkInDialog";
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
  data: CalendarData;
  /** The day's full bookings (day view only), for the desk dialogs. */
  appointments: Appointment[];
  role: string;
  date: string;
  view: "day" | "week";
  today: string;
  nowHHmm: string;
  openId?: string;
};

const OPEN_LANE = "__open";
const UNASSIGNED = "unassigned";

/** The page's toolbar, grid frame and dialogs for one branch. */
export function CalendarView(props: Props) {
  const { data, view, date, today } = props;
  const step = view === "week" ? 7 : 1;
  const base = view === "week" ? data.from : date;
  const href = (d: string, v = view) => `/dashboard/calendar?view=${v}&date=${d}`;
  const title =
    view === "week"
      ? `${formatDay(data.from)} – ${formatDay(data.to)}`
      : date === today
        ? `Today · ${formatDay(date)}`
        : formatDay(date, true);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-label={view === "week" ? "Previous week" : "Previous day"}>
            <Link href={href(addDay(base, -step))}>
              <ChevronLeft aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={href(today)}>Today</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label={view === "week" ? "Next week" : "Next day"}>
            <Link href={href(addDay(base, step))}>
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
          <h2 className="ml-2 text-sm font-semibold sm:text-base">{title}</h2>
        </div>
        <div className="flex rounded-full border border-border p-0.5" role="group" aria-label="View">
          {(["day", "week"] as const).map((v) => (
            <Link
              key={v}
              href={href(date, v)}
              aria-current={v === view ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium",
                v === view ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "day" ? "Day" : "Week"}
            </Link>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <WeekGrid {...props} />
      ) : date === today ? (
        <LiveDay {...props} />
      ) : (
        <StaticDay {...props} />
      )}
    </div>
  );
}

/* ---------- Day view ---------- */

// Only today's day view polls (the desk queue); other days are read once.
function LiveDay(props: Props) {
  const actions = useAppointmentActions();
  const { queue } = useLiveQueue(props.appointments, 20_000, actions.pendingId !== null);
  return <DayGrid {...props} list={queue} actions={actions} />;
}

function StaticDay(props: Props) {
  const actions = useAppointmentActions();
  return <DayGrid {...props} list={props.appointments} actions={actions} />;
}

type DayItem =
  | { kind: "booking"; id: string; start: string; end: string; row: AppointmentRow }
  | { kind: "slot"; id: string; start: string; end: string; slot: CalendarSlot }
  | { kind: "blocked"; id: string; start: string; end: string; reason: string };

const endOf = (a: Appointment) => {
  if (a.endTime) return a.endTime;
  const s = minutesOf(a.startTime) ?? 0;
  const e = s + (a.service?.duration ?? 30);
  return `${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
};

function DayGrid({
  data,
  list,
  actions,
  role,
  date,
  today,
  nowHHmm,
  openId,
}: Props & { list: Appointment[]; actions: AppointmentActions }) {
  const [nowMs] = useState(() => Date.now());
  const nowMin = useNowMinutes(nowHHmm);
  const readOnly = data.readOnly || role !== "SALON_OWNER";
  const isPastDay = date < today;

  const rows = actions
    .withPending(list)
    .filter((a) => a.status !== "CANCELLED")
    .map((a) => toAppointmentRow(a, nowMs, today));
  const dialogs = useBookingDialogs({ actions, rows });
  const [sheetId, setSheetId] = useState<string | null>(openId ?? null);
  const [sheetOpen, setSheetOpen] = useState(!!openId);
  const [walkIn, setWalkIn] = useState<CalendarSlot | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const sheetRow = rows.find((r) => r.id === sheetId) ?? null;

  const notStarted = (start: string) => date > today || (date === today && (minutesOf(start) ?? 0) > nowMin);
  const free = data.openSlots.filter((s) => dayOfStamp(s.start) === date && notStarted(s.start));

  const known = new Set(data.resources.map((r) => r.id));
  const resourceOf = (a: Appointment) => {
    const id = data.mode === "STAFF" ? a.staff?.id : a.counter?.id;
    return id && known.has(id) ? id : UNASSIGNED;
  };

  const items: Array<DayItem & { col: string }> = [
    ...rows.map((row) => ({
      kind: "booking" as const,
      id: row.id,
      col: resourceOf(row.raw),
      start: row.raw.startTime,
      end: endOf(row.raw),
      row,
    })),
    ...(readOnly || isPastDay
      ? []
      : free.map((slot) => ({
          kind: "slot" as const,
          id: slot.id,
          col: slot.resourceId ?? OPEN_LANE,
          start: slot.start,
          end: slot.end,
          slot,
        }))),
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

  const columns = [
    ...(items.some((i) => i.col === OPEN_LANE) ? [{ id: OPEN_LANE, name: "Open slots" }] : []),
    ...data.resources.filter((r) => r.id !== UNASSIGNED),
    ...(items.some((i) => i.col === UNASSIGNED) ? [{ id: UNASSIGNED, name: "Unassigned" }] : []),
  ];
  const bounds = gridBounds(
    data.hours.filter((h) => h.day === date),
    items,
  );

  const openBooking = (id: string) => {
    setSheetId(id);
    setSheetOpen(true);
  };
  const moveSlots = sheetRow
    ? free.filter((s) => s.serviceId === sheetRow.raw.service?.id && dayOfStamp(s.start) === sheetRow.date)
    : [];

  if (columns.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
        Nothing on this day. Add staff or counters and open slots to fill the calendar.
      </p>
    );
  }

  return (
    <>
      <Frame
        columns={columns.map((c) => ({ key: c.id, label: c.name }))}
        bounds={bounds}
        nowMin={date === today ? nowMin : null}
        render={(key) =>
          place(
            items.filter((i) => i.col === key),
            bounds.start,
          ).map((p) => <DayBlock key={p.id} item={p} onBooking={openBooking} onSlot={(s) => { setWalkIn(s); setWalkInOpen(true); }} />)
        }
      />
      {!readOnly && free.length > 0 && (
        <p className="text-xs text-muted-foreground">Tap a dashed free slot to book a walk-in.</p>
      )}

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
      <WalkInDialog slot={walkIn} open={walkInOpen} onOpenChange={setWalkInOpen} />
      {dialogs.dialogs}
    </>
  );
}

const laneStyle = (p: Placed<object>): CSSProperties => ({
  top: p.top,
  height: p.height,
  left: `calc(${(p.lane / p.lanes) * 100}% + 2px)`,
  width: `calc(${100 / p.lanes}% - 4px)`,
});

function DayBlock({
  item,
  onBooking,
  onSlot,
}: {
  item: Placed<DayItem>;
  onBooking: (id: string) => void;
  onSlot: (slot: CalendarSlot) => void;
}) {
  if (item.kind === "blocked") {
    return (
      <div
        className="absolute rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgb(0_0_0/0.04)_6px_12px)]"
        style={laneStyle(item)}
      >
        {item.reason}
      </div>
    );
  }
  if (item.kind === "slot") {
    return (
      <button
        type="button"
        onClick={() => onSlot(item.slot)}
        className="absolute flex items-start gap-1 overflow-hidden rounded-lg border border-dashed border-success/50 px-2 py-1 text-left text-xs text-success hover:bg-success-soft"
        style={laneStyle(item)}
        aria-label={`Book a walk-in at ${formatTime12(item.start.slice(11, 16))}${item.slot.serviceName ? `, ${item.slot.serviceName}` : ""}`}
      >
        <Plus aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
        <span className="truncate">{item.slot.serviceName ?? "Free"}</span>
      </button>
    );
  }
  const { row } = item;
  const tone = TONE_CLASSES[toneOf(row.status)];
  return (
    <button
      type="button"
      onClick={() => onBooking(row.id)}
      className={cn(
        "absolute overflow-hidden rounded-lg py-1 pr-2 pl-3 text-left text-xs shadow-sm ring-1 ring-black/5 hover:brightness-95",
        tone.soft,
      )}
      style={laneStyle(item)}
      aria-label={`${row.time}, ${row.customer}, ${row.service}, ${humanizeStatus(row.status)}`}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.dot)} aria-hidden="true" />
      <span className="block truncate font-semibold text-foreground">
        {row.serial !== null && `#${row.serial} `}
        {row.customer}
      </span>
      <span className="block truncate text-muted-foreground">
        {row.time} · {row.service}
      </span>
      <span className={cn("block truncate font-medium", tone.text)}>{humanizeStatus(row.status)}</span>
    </button>
  );
}

/* ---------- Week view ---------- */

function WeekGrid({ data, date, today, nowHHmm }: Props) {
  const nowMin = useNowMinutes(nowHHmm);
  const days = Array.from({ length: 7 }, (_, i) => addDay(data.from, i));
  const bounds = gridBounds(data.hours, data.bookings);

  return (
    <Frame
      columns={days.map((d) => ({
        key: d,
        label: (
          <Link href={`/dashboard/calendar?view=day&date=${d}`} className={cn("hover:text-primary", d === today && "text-primary")}>
            {formatDay(d)}
          </Link>
        ),
      }))}
      bounds={bounds}
      nowMin={days.includes(today) ? nowMin : null}
      nowColumn={today}
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
              className={cn("absolute overflow-hidden rounded-md py-0.5 pr-1 pl-2 text-[11px] leading-tight ring-1 ring-black/5", tone.soft)}
              style={laneStyle(b)}
              aria-label={`${formatTime12(b.start.slice(11, 16))}, ${b.customerName}, ${b.serviceName}, ${humanizeStatus(b.status)}`}
            >
              <span className={cn("absolute inset-y-0 left-0 w-0.5", tone.dot)} aria-hidden="true" />
              <span className="block truncate font-medium text-foreground">{b.customerName}</span>
              <span className="block truncate text-muted-foreground">{b.serviceName}</span>
            </Link>
          );
        })
      }
      selectedColumn={date}
    />
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
 * The scrolling frame: sticky resource header, sticky time column, 15-minute
 * rows. It scrolls both ways inside itself, so the page never scrolls sideways.
 */
function Frame({
  columns,
  bounds,
  nowMin,
  nowColumn,
  selectedColumn,
  compact = false,
  render,
}: {
  columns: Array<{ key: string; label: ReactNode }>;
  bounds: { start: number; end: number };
  nowMin: number | null;
  /** Week view: the now line only crosses today's column. */
  nowColumn?: string;
  selectedColumn?: string;
  compact?: boolean;
  render: (key: string) => ReactNode;
}) {
  const height = (bounds.end - bounds.start) * PX_PER_MIN;
  const hours = Array.from({ length: (bounds.end - bounds.start) / 60 }, (_, i) => bounds.start + i * 60);
  const showNow = nowMin !== null && nowMin >= bounds.start && nowMin <= bounds.end;
  const nowTop = showNow ? (nowMin - bounds.start) * PX_PER_MIN : 0;
  const lines: CSSProperties = {
    height,
    backgroundImage:
      "linear-gradient(to bottom, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-border) 45%, transparent) 1px, transparent 1px)",
    backgroundSize: `100% ${60 * PX_PER_MIN}px, 100% ${15 * PX_PER_MIN}px`,
  };

  return (
    <div className="max-h-[calc(100dvh-13rem)] min-h-80 overflow-auto overscroll-contain rounded-2xl border border-border bg-surface">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(${compact ? "7.5rem" : "140px"}, 1fr))`,
        }}
      >
        <div className="sticky top-0 left-0 z-30 border-r border-b border-border bg-surface" />
        {columns.map((c) => (
          <div
            key={c.key}
            className={cn(
              "sticky top-0 z-20 truncate border-b border-l border-border bg-surface px-2 py-2 text-xs font-semibold sm:text-sm",
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
                className="absolute right-1.5 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums first:translate-y-0"
                style={{ top: (h - bounds.start) * PX_PER_MIN }}
              >
                {hhmmLabel(h)}
              </span>
            ))}
          </div>
        </div>
        {columns.map((c) => (
          <div key={c.key} className="relative border-l border-border" style={lines}>
            {render(c.key)}
            {showNow && (!nowColumn || nowColumn === c.key) && (
              <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-danger" style={{ top: nowTop }} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
