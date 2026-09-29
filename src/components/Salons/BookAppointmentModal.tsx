/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Loader2,
  Scissors,
  Store,
  UserRound,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { Button } from "../ui/button";
import { getSlots } from "@/services/slots/slot-api";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import { resolveDepositMinor } from "@/lib/deposit";
import { addDays, format } from "date-fns";

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
    "mt-2 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const disabledFieldClass = "cursor-not-allowed bg-muted/40 text-muted-foreground";

  const stepperHeader = (
    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
      <div className="flex-1">
        <DialogTitle className="text-xl font-bold font-display">Book Appointment</DialogTitle>
        <p className="text-sm text-muted-foreground">{salon?.name}</p>
        
        <div className="flex items-center gap-2 mt-4 text-xs font-semibold uppercase tracking-wider">
          <span className={cn(step === 1 ? "text-primary" : "text-primary/40")}>Service</span>
          <span className="text-muted-foreground">→</span>
          <span className={cn(step === 2 ? "text-primary" : "text-primary/40")}>Date & Time</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">Review</span>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onClose} className="rounded-full -mt-8">
        ✕
      </Button>
    </div>
  );

  const step1Content = (
    <div className="space-y-6">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Scissors className="h-4 w-4 text-primary" /> Service *
        </label>
        <div className="space-y-2">
          {services.map((service) => (
            <label
              key={service.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors",
                form.serviceId === service.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="service"
                  value={service.id}
                  checked={form.serviceId === service.id}
                  onChange={(e) => setField("serviceId", e.target.value)}
                  className="size-4 accent-primary"
                />
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {typeof service.duration === "number" ? `${service.duration} min` : ""}
                  </div>
                </div>
              </div>
              {typeof service.priceMinor === "number" && (
                <div className="font-bold">{formatBDT(service.priceMinor)}</div>
              )}
            </label>
          ))}
        </div>
        {errors.serviceId && <p className="mt-1 text-xs text-destructive">{errors.serviceId}</p>}
      </div>

      {staffList.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <UserRound className="h-4 w-4 text-primary" /> Preferred specialist <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
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
        <label className="text-sm font-medium">Notes (optional)</label>
        <textarea
          className="mt-2 w-full min-h-[5rem] rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Allergies, preferred style, etc."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />
      </div>
    </div>
  );

  const step2Content = (
    <div className="space-y-6">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-3">
          <CalendarDays className="h-4 w-4 text-primary" /> Select Date
        </label>
        <div className="flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
          {dateStrip.map((dateStr) => {
            const date = new Date(dateStr);
            const dayName = format(date, "EEE");
            const dayNum = format(date, "d");
            const month = format(date, "MMM");
            const isSelected = form.appointmentDate === dateStr;
            
            return (
              <button
                key={dateStr}
                onClick={() => setField("appointmentDate", dateStr)}
                className={cn(
                  "snap-center shrink-0 flex flex-col items-center justify-center h-16 min-w-[4.5rem] rounded-xl border transition-colors",
                  isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                )}
              >
                <span className={cn("text-[10px] uppercase font-semibold", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>{dayName}</span>
                <span className="text-lg font-bold leading-tight">{dayNum}</span>
                <span className={cn("text-[10px] font-medium", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>{month}</span>
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            min={todayStr}
            className={cn(fieldClass, "mt-0 flex-1")}
            value={form.appointmentDate}
            onChange={(e) => setField("appointmentDate", e.target.value)}
          />
        </div>
        {errors.appointmentDate && <p className="mt-1 text-xs text-destructive">{errors.appointmentDate}</p>}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Store className="h-4 w-4 text-primary" /> Counter
        </label>

        {!counterStepReady ? (
          <div className={cn(fieldClass, disabledFieldClass, "flex items-center gap-2")}>
            {loadingSlots ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Checking availability...</>
            ) : (
              "Select a date first"
            )}
          </div>
        ) : counterOptions.length === 0 ? (
          <div className="mt-2 rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
            No counter is free on this date. Try another day.
          </div>
        ) : counterOptions.length === 1 ? (
          <div className={cn(fieldClass, "flex items-center bg-muted/50 font-medium")}>
            {selectedCounter?.name}
            {selectedCounter?.code ? ` (${selectedCounter.code})` : ""}
          </div>
        ) : (
          <select
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
          <label className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" /> Available times
          </label>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {visibleSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setField("slotId", slot.id)}
                className={cn(
                  "h-11 rounded-full border text-sm font-medium transition-colors",
                  form.slotId === slot.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                )}
              >
                {slot.startTime}
              </button>
            ))}
          </div>
          {visibleSlots.length === 0 && (
            <div className="text-sm text-muted-foreground">No times available.</div>
          )}
          {errors.slotId && <p className="mt-1 text-xs text-destructive">{errors.slotId}</p>}
        </div>
      )}
    </div>
  );

  const mainContent = (
    <>
      {stepperHeader}
      <div className="p-6 overflow-y-auto flex-1">
        {step === 1 ? step1Content : step2Content}
      </div>
      <div className="flex items-center justify-between border-t px-6 py-4 bg-background">
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-6"
          onClick={step === 1 ? onClose : handleBack}
        >
          {step === 1 ? "Cancel" : <><ArrowLeft className="h-4 w-4 mr-2" /> Back</>}
        </Button>
        <Button
          type="button"
          className="rounded-full px-8 gap-2"
          onClick={handleNext}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Next</>
          ) : step === 1 ? (
            <>Next <ArrowRight className="h-4 w-4" /></>
          ) : (
            <>Review Booking <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </>
  );

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
        <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none flex flex-col p-0">
          {mainContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        {mainContent}
      </DialogContent>
    </Dialog>
  );
}
