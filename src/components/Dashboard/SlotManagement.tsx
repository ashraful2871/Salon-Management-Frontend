"use client";

import { useState, useEffect, useTransition } from "react";
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
  deleteSlot,
  deleteBulkSlots,
} from "@/services/slots/slot-api";
import { showResultToast } from "@/components/Shared/showResultToast";
import {
  Calendar,
  Trash2,
  Ban,
  CheckCircle2,
  MonitorSmartphone,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ToneBadge } from "@/components/Shared/ToneBadge";

// Radix Select cannot hold an empty string, so "no counter" needs a sentinel.
const NO_COUNTER = "NONE";

type CounterOption = {
  id: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
};

const today = () => new Date().toISOString().split("T")[0];

export const SlotManagement = ({ salons }: { salons: any[] }) => {
  const [salonId, setSalonId] = useState<string>(salons[0]?.id || "");
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [isPending, startTransition] = useTransition();

  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState("30");
  const [breakDuration, setBreakDuration] = useState("0");
  const [serviceId, setServiceId] = useState("");
  const [counterId, setCounterId] = useState(NO_COUNTER);
  const [filterServiceId, setFilterServiceId] = useState("ALL");

  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  // Deleting can't be undone, so both paths ask first.
  const [confirmDelete, setConfirmDelete] = useState<
    { kind: "one"; id: string; time: string } | { kind: "selected" } | null
  >(null);
  // Separate from the content, so the text doesn't blank while the dialog fades out.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const askToDelete = (target: NonNullable<typeof confirmDelete>) => {
    setConfirmDelete(target);
    setConfirmOpen(true);
  };

  const selectedSalon = salons.find((s) => s.id === salonId);
  const services = selectedSalon?.services || [];
  // Counters arrive with the salon from /salons/my-salons — no extra fetch needed.
  const counters = ((selectedSalon?.counters ?? []) as CounterOption[]).filter(
    (c) => c.isActive !== false,
  );

  const dayCount = (() => {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.round((end - start) / 86_400_000) + 1;
  })();

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
        // Jump the monitoring list to the first generated day so the result is visible.
        if (selectedDate === startDate) {
          fetchSlots(salonId, selectedDate);
        } else {
          setSelectedDate(startDate);
        }
      }
    });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updateSlotStatus(id, status);
      showResultToast(res, `Slot marked as ${status}`, "Failed to update slot");
      if (res.success) {
        fetchSlots(salonId, selectedDate);
      }
    });
  };

  const runConfirmedDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "one") handleDelete(confirmDelete.id);
    else handleBulkDelete();
    setConfirmOpen(false);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSlot(id);
      showResultToast(
        res,
        "Slot deleted successfully",
        "Failed to delete slot",
      );
      if (res.success) {
        setSelectedSlotIds((prev) => prev.filter((slotId) => slotId !== id));
        fetchSlots(salonId, selectedDate);
      }
    });
  };

  const handleBulkDelete = () => {
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

  const filteredSlots =
    filterServiceId === "ALL"
      ? slots
      : slots.filter((s) => s.serviceId === filterServiceId);

  const groupedSlots = filteredSlots.reduce<Record<string, any[]>>(
    (acc, slot) => {
      const svc = services.find((s: any) => s.id === slot.serviceId);
      const serviceName = slot.service?.name || svc?.name || "Unknown Service";
      if (!acc[serviceName]) acc[serviceName] = [];
      acc[serviceName].push(slot);
      return acc;
    },
    {}
  );

  const confirmCount =
    confirmDelete?.kind === "one" ? 1 : selectedSlotIds.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slots"
        description="Create and manage appointment slots for your salon."
        actions={
          <div className="w-full sm:w-72">
            <Select value={salonId} onValueChange={handleSalonChange}>
              <SelectTrigger className="w-full" aria-label="Salon">
                <SelectValue placeholder="Select Salon" />
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
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Generate slots</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a date range, a time window and a service. Slots are cut to the
            chosen length with the break between them.
          </p>
        </CardHeader>
        <CardContent>
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
                  {services.map((svc: any) => (
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
              disabled={isPending || !salonId || !serviceId || dayCount === 0}
              className="w-full sm:w-auto"
            >
              <CalendarClock />
              Generate slots
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Existing slots</CardTitle>
            <p className="text-sm text-muted-foreground">
              {slotsLoading
                ? "Slots for"
                : `${filteredSlots.length} slot${filteredSlots.length === 1 ? "" : "s"} on`}{" "}
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-44"
            />
            <Select value={filterServiceId} onValueChange={setFilterServiceId}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Service filter">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All services</SelectItem>
                {services.map((svc: any) => (
                  <SelectItem key={svc.id} value={svc.id}>
                    {svc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk bar: only while something is selected. */}
          {selectedSlotIds.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {selectedSlotIds.length} slot
                {selectedSlotIds.length === 1 ? "" : "s"} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSlotIds([])}
                  disabled={isPending}
                >
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-white"
                  onClick={() => askToDelete({ kind: "selected" })}
                  disabled={isPending}
                >
                  <Trash2 />
                  Delete selected
                </Button>
              </div>
            </div>
          )}

          {slotsLoading ? (
            <div
              aria-busy="true"
              aria-label="Loading slots"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No slots on this date"
              description="Generate slots above, or pick another date."
            />
          ) : Object.keys(groupedSlots).length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No slots for this service"
              description="Choose another service or show all services."
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSlots).map(
                ([serviceName, serviceSlots]) => {
                  const selectable = serviceSlots
                    .filter((slot) => !(slot.status === "BOOKED" || slot.isBooked))
                    .map((slot) => slot.id as string);
                  const allSelected =
                    selectable.length > 0 &&
                    selectable.every((id) => selectedSlotIds.includes(id));
                  return (
                    <section key={serviceName}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                        <h3 className="font-semibold">
                          {serviceName}
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {serviceSlots.length} slot
                            {serviceSlots.length === 1 ? "" : "s"}
                          </span>
                        </h3>
                        {selectable.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupSelection(selectable)}
                          >
                            {allSelected ? "Unselect all" : "Select all"}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                        {serviceSlots?.map((slot: any) => {
                          const isBooked =
                            slot.status === "BOOKED" || slot.isBooked;
                          const selected = selectedSlotIds.includes(slot.id);
                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                "flex flex-col gap-2 rounded-xl border bg-surface p-3 transition-colors",
                                selected
                                  ? "border-primary ring-1 ring-primary/30"
                                  : "border-border",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                {isBooked ? (
                                  <span aria-hidden="true" className="size-4" />
                                ) : (
                                  <input
                                    type="checkbox"
                                    aria-label={`Select the ${slot.startTime} slot`}
                                    className="size-4 cursor-pointer accent-primary"
                                    checked={selected}
                                    onChange={() => toggleSlotSelection(slot.id)}
                                  />
                                )}
                                <ToneBadge status={slot.status} />
                              </div>
                              <div>
                                <p className="text-lg font-semibold leading-tight tabular-nums">
                                  {slot.startTime}
                                </p>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  to {slot.endTime}
                                </p>
                              </div>
                              <p
                                className={cn(
                                  "flex min-w-0 items-center gap-1 text-xs",
                                  slot.counter?.name
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                <MonitorSmartphone className="size-3 shrink-0" />
                                <span className="truncate">
                                  {slot.counter?.name ?? "No counter"}
                                </span>
                              </p>
                              {(slot.status === "AVAILABLE" ||
                                slot.status === "BLOCKED") && (
                                <div className="-mx-1 mt-auto flex items-center justify-end gap-1 border-t border-border pt-2">
                                  {slot.status === "AVAILABLE" ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-warning hover:bg-warning-soft hover:text-warning"
                                      aria-label={`Block the ${slot.startTime} slot`}
                                      title="Block"
                                      disabled={isPending}
                                      onClick={() =>
                                        handleUpdateStatus(slot.id, "BLOCKED")
                                      }
                                    >
                                      <Ban />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-success hover:bg-success-soft hover:text-success"
                                      aria-label={`Unblock the ${slot.startTime} slot`}
                                      title="Unblock"
                                      disabled={isPending}
                                      onClick={() =>
                                        handleUpdateStatus(slot.id, "AVAILABLE")
                                      }
                                    >
                                      <CheckCircle2 />
                                    </Button>
                                  )}
                                  {slot.status === "AVAILABLE" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-danger hover:bg-danger-soft hover:text-danger"
                                      aria-label={`Delete the ${slot.startTime} slot`}
                                      title="Delete"
                                      disabled={isPending}
                                      onClick={() =>
                                        askToDelete({
                                          kind: "one",
                                          id: slot.id,
                                          time: `${slot.startTime}–${slot.endTime}`,
                                        })
                                      }
                                    >
                                      <Trash2 />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive
        title={
          confirmDelete?.kind === "one"
            ? "Delete this slot?"
            : `Delete ${confirmCount} slot${confirmCount === 1 ? "" : "s"}?`
        }
        description={
          confirmDelete?.kind === "one"
            ? `The ${confirmDelete.time} slot will be removed and customers can no longer book it. This can't be undone.`
            : "The selected slots will be removed and customers can no longer book them. This can't be undone."
        }
        confirmLabel={confirmCount > 1 ? `Delete ${confirmCount} slots` : "Delete slot"}
        cancelLabel={confirmCount > 1 ? "Keep them" : "Keep it"}
        pending={isPending}
        onConfirm={runConfirmedDelete}
      />
    </div>
  );
};
