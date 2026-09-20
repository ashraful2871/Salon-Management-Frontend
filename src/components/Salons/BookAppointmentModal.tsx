/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Loader2,
  Scissors,
  Store,
  UserRound,
} from "lucide-react";

import { Button } from "../ui/button";
import { getSlots } from "@/services/slots/slot-api";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import { resolveDepositMinor } from "@/lib/deposit";

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
  // Slots generated since counter support are pinned to one counter; older
  // slots (and those generated without one) carry null and stay pickable.
  counterId?: string | null;
  counter?: { id: string; name: string; code?: string | null } | null;
};

type BookAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
  salon: SalonLike;
};

/**
 * Step 1 of the booking flow - pick what, when and where. Nothing is booked
 * here: continuing hands the selection to `/salons/[id]/book`, which is where
 * the customer reviews the money and confirms.
 */
const BookAppointmentModal = ({
  open,
  onClose,
  salon,
}: BookAppointmentModalProps) => {
  const router = useRouter();

  const services = useMemo(
    () => (salon?.services || []).filter((s) => s?.isActive !== false),
    [salon?.services],
  );

  const staffList = useMemo(
    () => (salon?.staff || []).filter((s) => !s?.isDeleted),
    [salon?.staff],
  );

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

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  useEffect(() => {
    if (form.appointmentDate && salon?.id && form.serviceId) {
      setLoadingSlots(true);
      getSlots({
        salonId: salon.id,
        date: form.appointmentDate,
        status: "AVAILABLE",
        serviceId: form.serviceId,
        // Today's earlier times are gone. Offering them only ends in a booking
        // the API refuses, or worse, one it accepts for a chair nobody kept.
        upcomingOnly: true,
      })
        .then((res) => {
          setSlots(res?.success ? res.data : []);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
    }
    // Reset the slot whenever the date or service changes - the old id belongs
    // to a list that no longer exists.
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

  // Which counters can actually take this service on this date. A counter earns
  // a place in the list by having free slots of its own, or by there being
  // unassigned slots (generated before counters existed) that any chair can take.
  const counterOptions = useMemo(
    () =>
      activeCounters
        .map((counter) => {
          // One button per start time: where the counter's own slot and a
          // shared unassigned slot cover the same time, the counter's wins.
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

  // Derived, never stored: one counter means there is nothing to choose, and a
  // counter that loses its availability when the date changes drops itself.
  const selectedCounterId = counterOptions.some((c) => c.id === form.counterId)
    ? form.counterId
    : counterOptions.length === 1
      ? counterOptions[0].id
      : "";

  const selectedCounter = counterOptions.find((c) => c.id === selectedCounterId);

  // Only the chosen counter's times are offered, so the time the customer taps
  // is always one that chair can actually serve.
  const visibleSlots = selectedCounter?.slots ?? [];
  const selectedSlot = visibleSlots.find((s) => s.id === form.slotId);

  const dateChosen = Boolean(form.appointmentDate);
  const serviceChosen = Boolean(form.serviceId);
  const counterStepReady = dateChosen && serviceChosen && !loadingSlots;

  const depositMinor = useMemo(
    () =>
      selectedService?.priceMinor
        ? resolveDepositMinor(
            {
              depositMinor: salon?.depositMinor,
              depositPercent: salon?.depositPercent,
            },
            selectedService.priceMinor,
          )
        : 0,
    [selectedService, salon?.depositMinor, salon?.depositPercent],
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.appointmentDate) nextErrors.appointmentDate = "Date is required";
    if (!form.serviceId) nextErrors.serviceId = "Service is required";
    if (!selectedCounterId) nextErrors.counterId = "Counter is required";
    if (!selectedSlot) nextErrors.slotId = "Pick a time slot";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate() || !selectedSlot) return;

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

  if (!open) return null;

  const fieldClass =
    "mt-2 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  const disabledFieldClass =
    "cursor-not-allowed bg-muted/40 text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl rounded-2xl border bg-background shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-start justify-between border-b px-6 py-5 shrink-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Step 1 of 2
              </p>
              <h3 className="mt-1 text-xl font-bold">Choose your appointment</h3>
              <p className="text-sm text-muted-foreground">
                {salon?.name || "Salon"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-primary" /> Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className={fieldClass}
                  value={form.appointmentDate}
                  onChange={(e) => setField("appointmentDate", e.target.value)}
                />
                {errors.appointmentDate && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.appointmentDate}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Scissors className="h-4 w-4 text-primary" /> Service *
                </label>
                <select
                  className={cn(fieldClass, !dateChosen && disabledFieldClass)}
                  disabled={!dateChosen}
                  value={form.serviceId}
                  onChange={(e) => setField("serviceId", e.target.value)}
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                      {typeof service.priceMinor === "number"
                        ? ` - ${formatBDT(service.priceMinor)}`
                        : ""}
                      {typeof service.duration === "number"
                        ? ` (${service.duration} min)`
                        : ""}
                    </option>
                  ))}
                </select>
                {errors.serviceId ? (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.serviceId}
                  </p>
                ) : !dateChosen ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pick a date first.
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Store className="h-4 w-4 text-primary" /> Counter *
              </label>

              {!counterStepReady ? (
                <div
                  className={cn(
                    fieldClass,
                    disabledFieldClass,
                    "flex items-center gap-2",
                  )}
                >
                  {loadingSlots ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking
                      availability...
                    </>
                  ) : (
                    "Select a date and service first"
                  )}
                </div>
              ) : counterOptions.length === 0 ? (
                <div className="mt-2 rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                  No counter is free for this service on this date. Try another
                  day.
                </div>
              ) : counterOptions.length === 1 ? (
                // Nothing to choose - the only counter with availability is taken
                // as the answer, so the customer just sees which one it is.
                <div
                  className={cn(
                    fieldClass,
                    "flex items-center bg-muted/50 font-medium",
                  )}
                >
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
                      {counter.code ? ` (${counter.code})` : ""} —{" "}
                      {counter.slots.length} time
                      {counter.slots.length === 1 ? "" : "s"} free
                    </option>
                  ))}
                </select>
              )}

              {errors.counterId && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.counterId}
                </p>
              )}
            </div>

            {counterStepReady && selectedCounter && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" /> Available times *
                </label>
                <p className="mt-2 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  {selectedCounter.name}
                  {selectedCounter.code ? ` (${selectedCounter.code})` : ""}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {visibleSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setField("slotId", slot.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm text-center transition-all",
                        form.slotId === slot.id
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "bg-background hover:border-primary/40 hover:bg-muted",
                      )}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
                {errors.slotId && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.slotId}
                  </p>
                )}
              </div>
            )}

            {staffList.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="h-4 w-4 text-primary" /> Preferred
                  specialist{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
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
                className="mt-2 w-full min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Anything the salon should know - allergies, preferred style, etc."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            {selectedService?.priceMinor ? (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service price</span>
                  <span className="font-semibold">
                    {formatBDT(selectedService.priceMinor)}
                  </span>
                </div>
                {depositMinor > 0 && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Deposit held to reserve
                    </span>
                    <span className="font-semibold">
                      {formatBDT(depositMinor)}
                    </span>
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  You will see the full breakdown and choose how to pay on the
                  next step.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={isNavigating}
              className="gap-2"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Opening summary...
                </>
              ) : (
                <>
                  Continue to summary <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
