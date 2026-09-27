"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBulkSlots,
  getSlots,
  updateSlotStatus,
  deleteBulkSlots,
} from "@/services/slots/slot-api";
import { showResultToast } from "@/components/Shared/showResultToast";
import {
  Ban,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MonitorSmartphone,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Salon } from "@/lib/api-types";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { EmptyState } from "@/components/Shared/EmptyState";
import {
  addDays,
  dhakaToday,
  formatDay,
  formatTime12,
} from "@/components/Dashboard/appointments/format";

// Radix Select cannot hold an empty string, so "no counter" needs a sentinel.
const NO_COUNTER = "NONE";
const STRIP_DAYS = 14;

type CounterOption = {
  id: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
};

// /salons/my-salons sends the counters along with each salon.
type SlotSalon = Salon & { counters?: CounterOption[] };

type SlotRow = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  isBooked?: boolean;
  serviceId?: string;
  service?: { name?: string } | null;
  counter?: { name?: string | null } | null;
};

const isBookedSlot = (slot: SlotRow) => slot.status === "BOOKED" || !!slot.isBooked;

// "2026-09-27" -> { weekday: "Sun", day: "27" }. Calendar days, read as UTC.
const STRIP_PARTS = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  timeZone: "UTC",
});
const stripLabel = (ymd: string) => {
  const parts = Object.fromEntries(
    STRIP_PARTS.formatToParts(new Date(`${ymd}T00:00:00Z`)).map((p) => [p.type, p.value]),
  );
  return { weekday: parts.weekday, day: parts.day };
};

/** Pill look per slot state. Booked can't be picked; blocked reads struck out. */
const slotClass = (slot: SlotRow, selected: boolean) => {
  if (isBookedSlot(slot)) return "border-transparent bg-info-soft text-info";
  if (selected) return "border-primary bg-primary-soft text-foreground ring-2 ring-primary";
  if (slot.status === "AVAILABLE")
    return "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-surface-subtle";
  if (slot.status === "BLOCKED")
    return "border-transparent bg-muted text-muted-foreground line-through";
  return "border-transparent bg-muted text-muted-foreground";
};

const LEGEND = [
  { label: "Free", swatch: "border border-border bg-surface" },
  { label: "Booked", swatch: "bg-info-soft ring-1 ring-info/40" },
  { label: "Blocked", swatch: "bg-muted ring-1 ring-muted-foreground/30" },
  { label: "Selected", swatch: "bg-primary-soft ring-2 ring-primary" },
];

export const SlotManagement = ({ salons }: { salons: SlotSalon[] }) => {
  const today = dhakaToday();
  const [salonId, setSalonId] = useState<string>(salons[0]?.id || "");
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isPending, startTransition] = useTransition();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState("30");
  const [breakDuration, setBreakDuration] = useState("0");
  const [serviceId, setServiceId] = useState("");
  const [counterId, setCounterId] = useState(NO_COUNTER);
  const [filterServiceId, setFilterServiceId] = useState("ALL");

  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  // Deleting can't be undone, so it asks first. Open state is separate from
  // the content, so the text doesn't blank while the dialog fades out.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [confirmTime, setConfirmTime] = useState("");

  const stripRef = useRef<HTMLDivElement>(null);
  const dayViewRef = useRef<HTMLDivElement>(null);

  const selectedSalon = salons.find((s) => s.id === salonId);
  const services = selectedSalon?.services || [];
  // Counters arrive with the salon from /salons/my-salons — no extra fetch needed.
  const counters = (selectedSalon?.counters ?? []).filter(
    (c) => c.isActive !== false,
  );
  const hasHours = Object.keys(selectedSalon?.operatingHours ?? {}).length > 0;

  const dayCount = (() => {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.round((end - start) / 86_400_000) + 1;
  })();

  // Fourteen days from today, shifted so the chosen day is always on it.
  const stripStart =
    selectedDate < today
      ? selectedDate
      : selectedDate > addDays(today, STRIP_DAYS - 1)
        ? addDays(selectedDate, -(STRIP_DAYS - 1))
        : today;
  const stripDays = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(stripStart, i));

  // Which salon and date the list on screen belongs to. Until it matches the
  // selection, the list shows a skeleton rather than "No slots on this date".
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const slotsLoading = !!salonId && loadedKey !== `${salonId}|${selectedDate}`;

  const fetchSlots = async (sId: string, date: string) => {
    const res = await getSlots({ salonId: sId, date });
    if (res?.success && res.data) {
      setSlots(res.data);
    } else {
      setSlots([]);
    }
    setLoadedKey(`${sId}|${date}`);
  };

  useEffect(() => {
    if (salonId) {
      fetchSlots(salonId, selectedDate);
      setSelectedSlotIds([]); // clear selection when context changes
    }
  }, [salonId, selectedDate]);

  // Keep the chosen day in view inside the strip, without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current;
    const pill = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !pill) return;
    strip.scrollTo({
      left: pill.offsetLeft - strip.clientWidth / 2 + pill.clientWidth / 2,
      behavior: "smooth",
    });
  }, [selectedDate]);

  // Services and counters belong to one salon — never carry a stale id across.
  const handleSalonChange = (id: string) => {
    setSalonId(id);
    setServiceId("");
    setCounterId(NO_COUNTER);
    setFilterServiceId("ALL");
  };

  const handleGenerate = () => {
    if (!salonId) return;
    if (endDate < startDate) {
      toast.error("End date must be on or after the start date");
      return;
    }
    startTransition(async () => {
      const payload = {
        salonId,
        startDate,
        endDate,
        counterId: counterId === NO_COUNTER ? undefined : counterId,
        startTime,
        endTime,
        duration: parseInt(duration, 10),
        breakDuration: parseInt(breakDuration, 10),
        serviceId,
      };
      const res = await createBulkSlots(payload);
      showResultToast(
        res,
        "Slots generated successfully!",
        "Failed to generate slots",
      );
      // A day that already has a booking only grows after its last slot, so
      // earlier times on those days were left out rather than renumbered.
      const lockedDates: string[] = res.data?.lockedDates ?? [];
      if (lockedDates.length) {
        toast.warning(
          `Some slots were not added on ${lockedDates.join(", ")}: bookings already exist. New slots can only go after the last existing slot.`,
        );
      }
      if (res.success) {
        // Jump the day view to the first generated day so the result is visible.
        if (selectedDate === startDate) {
          fetchSlots(salonId, selectedDate);
        } else {
          setSelectedDate(startDate);
        }
        dayViewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const filteredSlots =
    filterServiceId === "ALL"
      ? slots
      : slots.filter((s) => s.serviceId === filterServiceId);

  const selectedSlots = slots.filter((s) => selectedSlotIds.includes(s.id));
  const toBlock = selectedSlots.filter((s) => s.status === "AVAILABLE");
  const toUnblock = selectedSlots.filter((s) => s.status === "BLOCKED");

  // Block or unblock every selected slot that can make that move.
  const handleBulkStatus = (status: "BLOCKED" | "AVAILABLE") => {
    const ids = (status === "BLOCKED" ? toBlock : toUnblock).map((s) => s.id);
    if (ids.length === 0) return;
    const verb = status === "BLOCKED" ? "blocked" : "unblocked";
    startTransition(async () => {
      const results = await Promise.all(
        ids.map((id) => updateSlotStatus(id, status)),
      );
      const failed = results.filter((r) => !r?.success);
      if (failed.length === 0) {
        toast.success(`${ids.length} slot${ids.length === 1 ? "" : "s"} ${verb}`);
      } else {
        toast.error(
          failed[0]?.message ||
            `${failed.length} of ${ids.length} slots couldn't be ${verb}`,
        );
      }
      setSelectedSlotIds([]);
      fetchSlots(salonId, selectedDate);
    });
  };

  const askToDelete = () => {
    const only = selectedSlots.length === 1 ? selectedSlots[0] : null;
    setConfirmCount(selectedSlotIds.length);
    setConfirmTime(only ? `${formatTime12(only.startTime)}–${formatTime12(only.endTime)}` : "");
    setConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setConfirmOpen(false);
    if (selectedSlotIds.length === 0) return;
    startTransition(async () => {
      const res = await deleteBulkSlots(selectedSlotIds);
      showResultToast(
        res,
        res.message || "Selected slots deleted",
        "Failed to delete slots",
      );
      if (res.success) {
        setSelectedSlotIds([]);
        fetchSlots(salonId, selectedDate);
      }
    });
  };

  const toggleSlotSelection = (id: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(id)
        ? prev.filter((slotId) => slotId !== id)
        : [...prev, id],
    );
  };

  const toggleGroupSelection = (ids: string[]) => {
    setSelectedSlotIds((prev) =>
      ids.every((id) => prev.includes(id))
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])],
    );
  };

  // One group per service and counter, in time order.
  const groupedSlots = [...filteredSlots]
    .sort((a, b) => a.startTime.padStart(5, "0").localeCompare(b.startTime.padStart(5, "0")))
    .reduce<Record<string, { service: string; counter: string | null; slots: SlotRow[] }>>(
      (acc, slot) => {
        const service =
          slot.service?.name ||
          services.find((s) => s.id === slot.serviceId)?.name ||
          "Unknown service";
        const counter = slot.counter?.name ?? null;
        const key = `${service}|${counter ?? ""}`;
        (acc[key] ??= { service, counter, slots: [] }).slots.push(slot);
        return acc;
      },
      {},
    );

  const bookedCount = filteredSlots.filter(isBookedSlot).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slots"
        description={
          salons.length > 1
            ? "Open, block and clear booking slots, one day at a time."
            : `Open, block and clear booking slots for ${selectedSalon?.name ?? "your salon"}.`
        }
        actions={
          salons.length > 1 ? (
            <div className="w-full sm:w-72">
              <Select value={salonId} onValueChange={handleSalonChange}>
                <SelectTrigger className="w-full" aria-label="Salon">
                  <SelectValue placeholder="Select salon" />
                </SelectTrigger>
                <SelectContent>
                  {salons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      />

      <div ref={dayViewRef} className="scroll-mt-20">
        <Card className="gap-4">
          <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0 space-y-1">
              <CardTitle>{formatDay(selectedDate, true)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {slotsLoading
                  ? "Loading slots…"
                  : `${filteredSlots.length} slot${filteredSlots.length === 1 ? "" : "s"}${
                      bookedCount ? ` · ${bookedCount} booked` : ""
                    }`}
              </p>
            </div>
            <Select value={filterServiceId} onValueChange={setFilterServiceId}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Service filter">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All services</SelectItem>
                {services.map((svc) => (
                  <SelectItem key={svc.id} value={svc.id}>
                    {svc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6">
            {/* Date strip: swipe on a phone, step with ‹ › on a desktop. */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden shrink-0 md:inline-flex"
                aria-label="Previous day"
                onClick={() => setSelectedDate((d) => addDays(d, -1))}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <div
                ref={stripRef}
                role="group"
                aria-label="Day"
                className="relative flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-px-1 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {stripDays.map((ymd) => {
                  const { weekday, day } = stripLabel(ymd);
                  const isSelected = ymd === selectedDate;
                  const isToday = ymd === today;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${isToday ? "Today, " : ""}${formatDay(ymd)}`}
                      onClick={() => setSelectedDate(ymd)}
                      className={cn(
                        "flex h-16 w-14 shrink-0 cursor-pointer snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : isToday
                            ? "border-primary/50 bg-primary-soft text-foreground hover:bg-primary-soft/70"
                            : "border-border bg-surface text-foreground hover:bg-surface-subtle",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs",
                          isSelected ? "text-primary-foreground" : "text-muted-foreground",
                          isToday && "font-semibold",
                        )}
                      >
                        {isToday ? "Today" : weekday}
                      </span>
                      <span className="text-lg leading-none font-semibold tabular-nums">
                        {day}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden shrink-0 md:inline-flex"
                aria-label="Next day"
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>

            <ul
              aria-label="Legend"
              className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
            >
              {LEGEND.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn("size-3 rounded-full", item.swatch)} />
                  {item.label}
                </li>
              ))}
            </ul>

            {slotsLoading ? (
              <div
                aria-busy="true"
                aria-label="Loading slots"
                className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Skeleton key={i} className="h-11 rounded-full" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              hasHours ? (
                <EmptyState
                  icon={Calendar}
                  title="No slots on this day"
                  description="Generate slots below, or pick another day."
                />
              ) : (
                <EmptyState
                  icon={Clock}
                  title="Set your opening hours first"
                  description="Customers see them on your salon page, and they tell you which times to open slots for."
                  action={
                    <Button asChild>
                      <Link href={`/dashboard/store/${salonId}`}>Open Manage salon</Link>
                    </Button>
                  }
                />
              )
            ) : Object.keys(groupedSlots).length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No slots for this service"
                description="Choose another service or show all services."
              />
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSlots).map(([key, group]) => {
                  const selectable = group.slots
                    .filter((slot) => !isBookedSlot(slot))
                    .map((slot) => slot.id);
                  const allSelected =
                    selectable.length > 0 &&
                    selectable.every((id) => selectedSlotIds.includes(id));
                  return (
                    <section key={key} aria-label={group.service}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{group.service}</h3>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MonitorSmartphone aria-hidden="true" className="size-3 shrink-0" />
                            <span className="truncate">
                              {group.counter ?? "No counter"} · {group.slots.length} slot
                              {group.slots.length === 1 ? "" : "s"}
                            </span>
                          </p>
                        </div>
                        {selectable.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => toggleGroupSelection(selectable)}
                          >
                            {allSelected ? "Unselect all" : "Select all"}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {group.slots.map((slot) => {
                          const booked = isBookedSlot(slot);
                          const selected = selectedSlotIds.includes(slot.id);
                          const time = formatTime12(slot.startTime);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={booked}
                              aria-pressed={booked ? undefined : selected}
                              aria-label={`${time} to ${formatTime12(slot.endTime)}, ${
                                booked ? "booked" : slot.status.toLowerCase()
                              }`}
                              title={`${time} – ${formatTime12(slot.endTime)}`}
                              onClick={() => toggleSlotSelection(slot.id)}
                              className={cn(
                                "h-11 min-w-0 cursor-pointer rounded-full border px-2 text-sm font-medium whitespace-nowrap tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed",
                                slotClass(slot, selected),
                              )}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk bar: sticks above the phone's tab bar while anything is selected. */}
      {selectedSlotIds.length > 0 && (
        <div
          role="region"
          aria-label="Selected slots"
          className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-lg lg:bottom-4"
        >
          <p className="mr-auto text-sm font-medium tabular-nums">
            {selectedSlotIds.length} selected
          </p>
          {toBlock.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkStatus("BLOCKED")}
            >
              <Ban aria-hidden="true" />
              Block
            </Button>
          )}
          {toUnblock.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkStatus("AVAILABLE")}
            >
              <CheckCircle2 aria-hidden="true" />
              Unblock
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={askToDelete}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setSelectedSlotIds([])}
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        </div>
      )}

      <Card className="gap-4">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Generate slots</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a date range, a time window and a service. Slots are cut to the
            chosen length with the break between them.
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setStartDate(value);
                  // Keep the range valid when the start is pushed past the end.
                  if (value > endDate) setEndDate(value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End date</label>
              <Input
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Service</label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Counter</label>
              <Select value={counterId} onValueChange={setCounterId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select counter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COUNTER}>No counter</SelectItem>
                  {counters.map((counter) => (
                    <SelectItem key={counter.id} value={counter.id}>
                      {counter.name}
                      {counter.code ? ` (${counter.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {counters.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No counters yet — add one under Manage Salon.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Break</label>
              <Select value={breakDuration} onValueChange={setBreakDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {dayCount === 0
                ? "End date must be on or after the start date."
                : `Generating for ${dayCount} day${dayCount === 1 ? "" : "s"}${
                    counterId === NO_COUNTER
                      ? ""
                      : ` on ${
                          counters.find((c) => c.id === counterId)?.name ??
                          "the selected counter"
                        }`
                  }.`}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={!salonId || !serviceId || dayCount === 0}
              loading={isPending}
              className="w-full sm:w-auto"
            >
              <CalendarClock aria-hidden="true" />
              Generate slots
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="danger"
        title={confirmCount === 1 ? "Delete this slot?" : `Delete ${confirmCount} slots?`}
        description={
          confirmCount === 1
            ? `The ${confirmTime || "selected"} slot will be removed and customers can no longer book it. This can't be undone.`
            : "The selected slots will be removed and customers can no longer book them. This can't be undone."
        }
        confirmLabel={confirmCount > 1 ? `Delete ${confirmCount} slots` : "Delete slot"}
        cancelLabel={confirmCount > 1 ? "Keep them" : "Keep it"}
        pending={isPending}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
};
