/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useActionState } from "react";
import { Button } from "../ui/button";
import { bookingAppointment } from "@/services/appoinments/book-appoiments";
import { toast } from "sonner";

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
  price?: number;
  duration?: number;
  isActive?: boolean;
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
};

type BookAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
  salon: SalonLike;
};

const BookAppointmentModal = ({
  open,
  onClose,
  salon,
}: BookAppointmentModalProps) => {
  const [state, formAction, isPending] = useActionState(
    bookingAppointment,
    null,
  );

  console.log(state);

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
    appointmentDate: "",
    startTime: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const lastProcessedState = React.useRef(state);

  useEffect(() => {
    if (!state || lastProcessedState.current === state) return;
    lastProcessedState.current = state;

    if (state?.success) {
      toast.success(state?.message || "Appointment booked successfully");
      onClose();
      setTimeout(() => {
        setForm({
          counterId: "",
          serviceId: "",
          appointmentDate: "",
          startTime: "",
          notes: "",
        });
        setErrors({});
      }, 0);
    } else if (state?.success === false) {
      toast.error(state?.message || "Failed to book appointment");
    }
  }, [state, onClose]);

  if (!open) return null;

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.counterId) nextErrors.counterId = "Counter is required";
    if (!form.serviceId) nextErrors.serviceId = "Service is required";
    if (!form.appointmentDate)
      nextErrors.appointmentDate = "Appointment date is required";
    if (!form.startTime) nextErrors.startTime = "Start time is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // client-side guard before submit
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const ok = validate();
    if (!ok) e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl rounded-2xl border bg-background shadow-xl"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold">Book Appointment</h3>
              <p className="text-sm text-muted-foreground">
                {salon?.name || "Salon"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* ✅ FORM ACTION */}
          <form action={formAction} onSubmit={handleFormSubmit}>
            {/* hidden salonId */}
            <input type="hidden" name="salonId" value={salon.id} />

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Counter + Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Counter *</label>
                  <select
                    name="counterId"
                    className="mt-2 w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.counterId}
                    onChange={(e) => setField("counterId", e.target.value)}
                  >
                    <option value="">Select counter</option>
                    {salon?.counters?.map((counter) => (
                      <option key={counter.id} value={counter.id}>
                        {counter.name}
                        {counter.code ? ` (${counter.code})` : ""}
                      </option>
                      //
                    ))}
                  </select>
                  {errors.counterId && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.counterId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <input
                    name="appointmentDate"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-2 w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.appointmentDate}
                    onChange={(e) =>
                      setField("appointmentDate", e.target.value)
                    }
                  />
                  {errors.appointmentDate && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.appointmentDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Time + Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Time *</label>
                  <input
                    name="startTime"
                    type="time"
                    className="mt-2 w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.startTime}
                    onChange={(e) => setField("startTime", e.target.value)}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.startTime}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Service *</label>
                  <select
                    name="serviceId"
                    className="mt-2 w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.serviceId}
                    onChange={(e) => setField("serviceId", e.target.value)}
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                        {typeof service.price === "number"
                          ? ` — ৳${service.price}`
                          : ""}
                        {typeof service.duration === "number"
                          ? ` (${service.duration} min)`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {errors.serviceId && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.serviceId}
                    </p>
                  )}
                </div>
              </div>



              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  name="notes"
                  className="mt-2 w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Write any preferences..."
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>


            </div>

            <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
