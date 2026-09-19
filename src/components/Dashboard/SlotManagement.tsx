"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const fetchSlots = async (sId: string, date: string) => {
    const res = await getSlots({ salonId: sId, date });
    if (res?.success && res.data) {
      setSlots(res.data);
    } else {
      setSlots([]);
    }
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

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSlot(id);
      showResultToast(
        res,
        "Slot deleted successfully",
        "Failed to delete slot",
      );
      if (res.success) {
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

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Slot Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage appointment slots for your salon.
          </p>
        </div>
        <div className="w-full md:w-64">
          <Select value={salonId} onValueChange={handleSalonChange}>
            <SelectTrigger>
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
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Start Date</label>
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
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service</label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Service" />
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
            <div>
              <label className="text-sm font-medium">Counter</label>
              <Select value={counterId} onValueChange={setCounterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Counter" />
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
                <p className="text-xs text-muted-foreground mt-1">
                  No counters yet — add one under Manage Salon.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Duration (min)</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
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
            <div>
              <label className="text-sm font-medium">Break (min)</label>
              <Select value={breakDuration} onValueChange={setBreakDuration}>
                <SelectTrigger>
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
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            >
              Generate Slots
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>Existing Slots ({selectedDate})</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-44">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                value={filterServiceId}
                onValueChange={setFilterServiceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Services</SelectItem>
                  {services.map((svc: any) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSlotIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isPending}
              >
                Delete Selected ({selectedSlotIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No slots generated for this date.
            </p>
          ) : Object.keys(groupedSlots).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No slots found for this service.
            </p>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSlots).map(
                ([serviceName, serviceSlots]) => (
                  <div key={serviceName}>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                      {serviceName}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {serviceSlots?.map((slot: any) => {
                        const isBooked =
                          slot.status === "BOOKED" || slot.isBooked;
                        return (
                          <div
                            key={slot.id}
                            className="border rounded-lg p-3 flex flex-col gap-2 items-center justify-center text-center bg-muted/20 relative"
                          >
                            {!isBooked && (
                              <input
                                type="checkbox"
                                className="absolute top-2 left-2 cursor-pointer h-4 w-4"
                                checked={selectedSlotIds.includes(slot.id)}
                                onChange={() => toggleSlotSelection(slot.id)}
                              />
                            )}
                            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full mb-1 line-clamp-1">
                              {slot.service?.name ||
                                services.find(
                                  (s: any) => s.id === slot.serviceId,
                                )?.name ||
                                "Service"}
                            </span>
                            <span className="font-medium">
                              {slot.startTime}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              to {slot.endTime}
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1 text-[11px]",
                                slot.counter?.name
                                  ? "text-foreground"
                                  : "text-muted-foreground italic",
                              )}
                            >
                              <MonitorSmartphone className="h-3 w-3 shrink-0" />
                              <span className="line-clamp-1">
                                {slot.counter?.name ?? "No counter"}
                              </span>
                            </span>
                            <Badge
                              variant={
                                slot.status === "AVAILABLE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {slot.status}
                            </Badge>
                            <div className="flex gap-2 mt-2">
                              {slot.status === "AVAILABLE" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      handleUpdateStatus(slot.id, "BLOCKED")
                                    }
                                  >
                                    <Ban className="h-4 w-4 text-amber-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleDelete(slot.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                              {slot.status === "BLOCKED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    handleUpdateStatus(slot.id, "AVAILABLE")
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
