"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBulkSlots, getSlots, updateSlotStatus, deleteSlot } from "@/services/slots/slot-api";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Calendar, Trash2, Ban, CheckCircle2 } from "lucide-react";

export const SlotManagement = ({ salons }: { salons: any[] }) => {
  const [salonId, setSalonId] = useState<string>(salons[0]?.id || "");
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isPending, startTransition] = useTransition();
  
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState("30");
  const [breakDuration, setBreakDuration] = useState("0");

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
    }
  }, [salonId, selectedDate]);

  const handleGenerate = () => {
    if (!salonId) return;
    startTransition(async () => {
      const payload = {
        salonId,
        date: selectedDate,
        startTime,
        endTime,
        duration: parseInt(duration, 10),
        breakDuration: parseInt(breakDuration, 10),
      };
      const res = await createBulkSlots(payload);
      showResultToast(res, "Slots generated successfully!", "Failed to generate slots");
      if (res.success) {
        fetchSlots(salonId, selectedDate);
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
      showResultToast(res, "Slot deleted successfully", "Failed to delete slot");
      if (res.success) {
        fetchSlots(salonId, selectedDate);
      }
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Slot Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage appointment slots for your salon.</p>
        </div>
        <div className="w-full md:w-64">
          <Select value={salonId} onValueChange={setSalonId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Salon" />
            </SelectTrigger>
            <SelectContent>
              {salons.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (min)</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerate} disabled={isPending || !salonId}>
              Generate Slots
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Slots ({selectedDate})</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No slots generated for this date.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {slots.map(slot => (
                <div key={slot.id} className="border rounded-lg p-3 flex flex-col gap-2 items-center justify-center text-center bg-muted/20">
                  <span className="font-medium">{slot.startTime}</span>
                  <span className="text-xs text-muted-foreground">to {slot.endTime}</span>
                  <Badge variant={slot.status === "AVAILABLE" ? "default" : "secondary"}>{slot.status}</Badge>
                  <div className="flex gap-2 mt-2">
                    {slot.status === "AVAILABLE" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateStatus(slot.id, "BLOCKED")}>
                          <Ban className="h-4 w-4 text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(slot.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    {slot.status === "BLOCKED" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateStatus(slot.id, "AVAILABLE")}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
