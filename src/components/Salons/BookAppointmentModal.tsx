/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Scissors,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

import { Button } from "../ui/button";
import { getSlots } from "@/services/slots/slot-api";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import { addDays, format, parseISO } from "date-fns";

const STEPS = ["Service", "Date & time", "Review"] as const;

const formatClock = (time: string) => {
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  if (!Number.isFinite(hour) || minute === undefined) return time;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

type CounterItem = {
  id: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
};

type ServiceItem = {
  id: string;
  name: string;
  priceMinor?: number;
  duration?: number;
  isActive?: boolean;
  category?: string;
};

type StaffItem = {
  id: string;
  speciality?: string;
  isDeleted?: boolean;
  user?: {
    name?: string;
  };
};

type SalonLike = {
  id: string;
  name?: string;
  counters?: CounterItem[];
  services?: ServiceItem[];
  staff?: StaffItem[];
  depositMinor?: number;
  depositPercent?: number | null;
};

type SlotLike = {
  id: string;
  startTime: string;
  endTime?: string;
  counterId?: string | null;
  counter?: { id: string; name: string; code?: string | null } | null;
};

type BookAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
  salon: SalonLike;
  initialServiceId?: string;
};

export default function BookAppointmentModal({
  open,
  onClose,
  salon,
  initialServiceId,
}: BookAppointmentModalProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const services = useMemo(
    () => (salon?.services || []).filter((s) => s?.isActive !== false),
    [salon?.services],
  );

  const staffList = useMemo(
    () => (salon?.staff || []).filter((s) => !s?.isDeleted),
    [salon?.staff],
  );

  const [step, setStep] = useState(1); // 1 = Service, 2 = Date & time

  const [form, setForm] = useState({
    counterId: "",
    serviceId: "",
    staffId: "",
    appointmentDate: "",
    slotId: "",
    notes: "",
  });

  const [slots, setSlots] = useState<SlotLike[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (initialServiceId) {
        setForm((prev) => ({ ...prev, serviceId: initialServiceId }));
      }
      setStep(1);
      setErrors({});
    }
  }, [open, initialServiceId]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  // Build a date strip starting from today
  const dateStrip = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = addDays(now, i);
      dates.push(format(d, "yyyy-MM-dd"));
    }
    return dates;
  }, []);

  // Preselect today if nothing is selected when reaching step 2
  useEffect(() => {
    if (step === 2 && !form.appointmentDate) {
      setField("appointmentDate", todayStr);
    }
  }, [step, form.appointmentDate, todayStr]);

  useEffect(() => {
    if (form.appointmentDate && salon?.id && form.serviceId) {
      setLoadingSlots(true);
      getSlots({
        salonId: salon.id,
        date: form.appointmentDate,
        status: "AVAILABLE",
        serviceId: form.serviceId,
        upcomingOnly: true,
      })
        .then((res) => {
          setSlots(res?.success ? res.data : []);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
    }
    setField("slotId", "");
  }, [form.appointmentDate, salon?.id, form.serviceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === form.serviceId),
    [services, form.serviceId],
  );

  const activeCounters = useMemo(
    () =>
      (salon?.counters || []).filter(
        (c) => c?.isActive !== false && !c?.isDeleted,
      ),
    [salon?.counters],
  );

  const counterOptions = useMemo(
    () =>
      activeCounters
        .map((counter) => {
          const byTime = new Map<string, SlotLike>();
          for (const slot of slots) {
            if (slot.counterId != null && slot.counterId !== counter.id) continue;
            const existing = byTime.get(slot.startTime);
            if (
              !existing ||
              (existing.counterId == null && slot.counterId === counter.id)
            ) {
              byTime.set(slot.startTime, slot);
            }
          }
          return {
            ...counter,
            slots: Array.from(byTime.values()).sort((a, b) =>
              a.startTime.localeCompare(b.startTime),
            ),
          };
        })
        .filter((option) => option.slots.length > 0),
    [activeCounters, slots],
  );

  const selectedCounterId = counterOptions.some((c) => c.id === form.counterId)
    ? form.counterId
    : counterOptions.length === 1
      ? counterOptions[0].id
      : "";

  const selectedCounter = counterOptions.find((c) => c.id === selectedCounterId);
  const visibleSlots = selectedCounter?.slots ?? [];
  const selectedSlot = visibleSlots.find((s) => s.id === form.slotId);

  const dateChosen = Boolean(form.appointmentDate);
  const serviceChosen = Boolean(form.serviceId);
  const counterStepReady = dateChosen && serviceChosen && !loadingSlots;

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.serviceId) nextErrors.serviceId = "Service is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.appointmentDate) nextErrors.appointmentDate = "Date is required";
    if (!selectedCounterId) nextErrors.counterId = "Counter is required";
    if (!selectedSlot) nextErrors.slotId = "Pick a time slot";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else {
      handleContinue();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleContinue = () => {
    if (!validateStep2() || !selectedSlot) return;

    const query = new URLSearchParams({
      service: form.serviceId,
      counter: selectedCounterId,
      slot: selectedSlot.id,
      date: form.appointmentDate,
    });
    if (form.staffId) query.set("staff", form.staffId);
    if (form.notes.trim()) query.set("notes", form.notes.trim());

    setIsNavigating(true);
    router.push(`/salons/${salon.id}/book?${query.toString()}`);
  };

  const fieldClass =
    "mt-2 w-full h-11 rounded-xl border border-input bg-surface px-3 text-base md:text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const disabledFieldClass = "cursor-not-allowed bg-muted/40 text-muted-foreground";

  const renderHeader = (
    Title: typeof DialogTitle | typeof DrawerTitle,
    Description: typeof DialogDescription | typeof DrawerDescription,
  ) => (
    <div className="shrink-0 border-b px-4 pt-3 pb-4 sm:px-6 sm:pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Title className="font-display text-lg font-semibold sm:text-xl">Book an appointment</Title>
          <Description className="truncate text-sm text-muted-foreground">{salon?.name}</Description>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 shrink-0"
        >
          <X aria-hidden />
        </Button>
      </div>

      <ol className="mt-4 flex items-center gap-2" aria-label="Booking steps">
        {STEPS.map((label, i) => {
          const index = i + 1;
          const state = index < step ? "done" : index === step ? "current" : "todo";
          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn("flex min-w-0 items-center gap-2", i < STEPS.length - 1 && "flex-1")}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  state === "done" && "bg-primary-soft text-primary",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "todo" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5" aria-hidden /> : index}
              </span>
              <span
                className={cn(
                  "truncate text-xs sm:text-sm",
                  state === "current" ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className={cn("h-px min-w-3 flex-1", index < step ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );

  const step1Content = (
    <div className="space-y-6">
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium mb-2">
          <Scissors className="h-4 w-4 text-primary" aria-hidden /> Service
        </legend>
        <div className="space-y-2">
          {services.map((service) => (
            <label
              key={service.id}
              className={cn(
                "flex items-center justify-between gap-3 p-4 rounded-2xl border cursor-pointer transition-colors",
                form.serviceId === service.id
                  ? "border-primary bg-primary-soft ring-1 ring-primary"
                  : "border-border bg-surface hover:bg-surface-subtle",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="radio"
                  name="service"
                  value={service.id}
                  checked={form.serviceId === service.id}
                  onChange={(e) => setField("serviceId", e.target.value)}
                  className="size-4 shrink-0 accent-primary"
                />
                <div className="min-w-0">
                  <div className="font-medium break-words">{service.name}</div>
                  {typeof service.duration === "number" && (
                    <div className="text-xs text-muted-foreground">{service.duration} min</div>
                  )}
                </div>
              </div>
              {typeof service.priceMinor === "number" && (
                <div className="shrink-0 font-semibold tabular-nums">{formatBDT(service.priceMinor)}</div>
              )}
            </label>
          ))}
        </div>
        {errors.serviceId && <p className="mt-1 text-xs text-destructive">{errors.serviceId}</p>}
      </fieldset>

      {staffList.length > 0 && (
        <div>
          <label htmlFor="booking-staff" className="flex items-center gap-2 text-sm font-medium">
            <UserRound className="h-4 w-4 text-primary" aria-hidden /> Preferred specialist{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id="booking-staff"
            className={fieldClass}
            value={form.staffId}
            onChange={(e) => setField("staffId", e.target.value)}
          >
            <option value="">No preference - assign anyone</option>
            {staffList.map((member) => (
              <option key={member.id} value={member.id}>
                {member.user?.name || "Specialist"}
                {member.speciality ? ` - ${member.speciality}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="booking-notes" className="text-sm font-medium">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          className="mt-2 w-full min-h-[5rem] rounded-xl border border-input bg-surface px-3 py-2 text-base md:text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Allergies, preferred style, etc."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />
      </div>
    </div>
  );

  const step2Content = (
    <div className="space-y-6">
      {selectedService && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-subtle px-4 py-3 text-sm">
          <span className="min-w-0 truncate font-medium">{selectedService.name}</span>
          {typeof selectedService.priceMinor === "number" && (
            <span className="shrink-0 font-semibold tabular-nums">{formatBDT(selectedService.priceMinor)}</span>
          )}
        </div>
      )}

      <div>
        <p className="flex items-center gap-2 text-sm font-medium mb-3">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden /> Date
        </p>
        <div
          role="group"
          aria-label="Day"
          className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-px-1 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {dateStrip.map((dateStr, i) => {
            const date = parseISO(dateStr);
            const isSelected = form.appointmentDate === dateStr;
            const isToday = i === 0;

            return (
              <button
                key={dateStr}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${isToday ? "Today, " : ""}${format(date, "EEEE d MMMM")}`}
                onClick={() => setField("appointmentDate", dateStr)}
                className={cn(
                  "flex h-16 w-14 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
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
                  {isToday ? "Today" : format(date, "EEE")}
                </span>
                <span className="text-lg leading-none font-semibold tabular-nums">{format(date, "d")}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="booking-date" className="sr-only">
          Or pick another date
        </label>
        <input
          id="booking-date"
          type="date"
          min={todayStr}
          className={cn(fieldClass, "mt-3")}
          value={form.appointmentDate}
          onChange={(e) => setField("appointmentDate", e.target.value)}
        />
        {errors.appointmentDate && <p className="mt-1 text-xs text-destructive">{errors.appointmentDate}</p>}
      </div>

      <div>
        <label htmlFor="booking-counter" className="flex items-center gap-2 text-sm font-medium">
          <Store className="h-4 w-4 text-primary" aria-hidden /> Counter
        </label>

        {!counterStepReady ? (
          <div className={cn(fieldClass, disabledFieldClass, "flex items-center gap-2")}>
            {loadingSlots ? (
              <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking availability...</>
            ) : (
              "Select a date first"
            )}
          </div>
        ) : counterOptions.length === 0 ? (
          <div className="mt-2 rounded-2xl bg-warning-soft p-4 text-center text-sm text-warning">
            No counter is free on this date. Try another day.
          </div>
        ) : counterOptions.length === 1 ? (
          <div className={cn(fieldClass, "flex items-center bg-surface-subtle font-medium")}>
            {selectedCounter?.name}
            {selectedCounter?.code ? ` (${selectedCounter.code})` : ""}
          </div>
        ) : (
          <select
            id="booking-counter"
            className={fieldClass}
            value={selectedCounterId}
            onChange={(e) => setField("counterId", e.target.value)}
          >
            <option value="">Select counter</option>
            {counterOptions.map((counter) => (
              <option key={counter.id} value={counter.id}>
                {counter.name}
                {counter.code ? ` (${counter.code})` : ""} — {counter.slots.length} time{counter.slots.length === 1 ? "" : "s"} free
              </option>
            ))}
          </select>
        )}
        {errors.counterId && <p className="mt-1 text-xs text-destructive">{errors.counterId}</p>}
      </div>

      {counterStepReady && selectedCounter && (
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" aria-hidden /> Available times
          </p>
          <div role="group" aria-label="Time" className="grid grid-cols-3 gap-2 mt-3 sm:grid-cols-4">
            {visibleSlots.map((slot) => {
              const selected = form.slotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setField("slotId", slot.id)}
                  className={cn(
                    "h-11 min-w-0 rounded-full border px-2 text-sm font-medium whitespace-nowrap tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:border-primary/50 hover:bg-primary-soft",
                  )}
                >
                  {formatClock(slot.startTime)}
                </button>
              );
            })}
          </div>
          {visibleSlots.length === 0 && (
            <p className="text-sm text-muted-foreground">No times available.</p>
          )}
          {errors.slotId && <p className="mt-1 text-xs text-destructive">{errors.slotId}</p>}
        </div>
      )}
    </div>
  );

  const body = (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      {step === 1 ? step1Content : step2Content}
    </div>
  );

  const footer = (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
      <Button
        type="button"
        variant="outline"
        onClick={step === 1 ? onClose : handleBack}
      >
        {step === 1 ? "Cancel" : <><ArrowLeft aria-hidden /> Back</>}
      </Button>
      <Button
        type="button"
        className="min-w-0 flex-1 sm:flex-none sm:px-8"
        onClick={handleNext}
        loading={isNavigating}
      >
        {step === 1 ? "Next" : "Review booking"}
        {!isNavigating && <ArrowRight aria-hidden />}
      </Button>
    </div>
  );

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
        <DrawerContent className="h-[95dvh] bg-surface p-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[95dvh] data-[vaul-drawer-direction=bottom]:rounded-t-2xl">
          {renderHeader(DrawerTitle, DrawerDescription)}
          {body}
          {footer}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl bg-surface p-0 sm:max-w-2xl"
      >
        {renderHeader(DialogTitle, DialogDescription)}
        {body}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
