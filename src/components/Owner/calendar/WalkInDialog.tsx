"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatDay, formatTime12 } from "@/components/Dashboard/appointments/format";
import { bookWalkIn } from "@/services/appoinments/bookWalkIn";
import type { CalendarSlot } from "@/services/appoinments/calendar-types";

/** A walk-in into the free slot the owner tapped. */
export function WalkInDialog({
  slot,
  open,
  onOpenChange,
}: {
  slot: CalendarSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    startTransition(async () => {
      const res = await bookWalkIn({
        slotId: slot.id,
        customerName: name,
        customerPhone: phone,
        notes: notes.trim() || undefined,
      });
      showResultToast(res, "Walk-in booked", "Failed to book the walk-in");
      if (res.success) {
        setName("");
        setPhone("");
        setNotes("");
        onOpenChange(false);
      }
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Book a walk-in"
      description={
        slot &&
        [slot.serviceName, formatDay(slot.start.slice(0, 10)), formatTime12(slot.start.slice(11, 16))]
          .filter(Boolean)
          .join(" · ")
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="walk-in-form" loading={pending}>
            Book walk-in
          </Button>
        </>
      }
    >
      <form id="walk-in-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="walk-in-name">Customer name</Label>
          <Input id="walk-in-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="walk-in-phone">Phone</Label>
          <Input
            id="walk-in-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="01XXXXXXXXX"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="walk-in-notes">Notes (optional)</Label>
          <Input id="walk-in-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </div>
      </form>
    </ResponsiveDialog>
  );
}
