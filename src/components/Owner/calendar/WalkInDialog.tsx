"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatDay, formatTime12 } from "@/components/Dashboard/appointments/format";
import { bookWalkIn } from "@/services/appoinments/bookWalkIn";
import type { CalendarResource, CalendarSlot } from "@/services/appoinments/calendar-types";
import { minutesOf } from "./calendar-grid";

const NO_STYLIST = "none";

/** True when one of the stylist's off ranges touches the slot. The API checks again. */
const isOff = (stylist: CalendarResource, slot: CalendarSlot) => {
  const day = slot.start.slice(0, 10);
  const s = minutesOf(slot.start) ?? 0;
  const e = Math.max(minutesOf(slot.end) ?? s, s + 1);
  return (stylist.off ?? []).some(
    (o) => o.start.slice(0, 10) === day && (minutesOf(o.start) ?? 0) < e && (minutesOf(o.end) ?? 0) > s,
  );
};

/** A walk-in into the free slot the owner tapped, optionally with a stylist on shift. */
export function WalkInDialog({
  slot,
  open,
  onOpenChange,
  stylists = [],
}: {
  slot: CalendarSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylists?: CalendarResource[];
}) {
  const [staffId, setStaffId] = useState(NO_STYLIST);
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
        ...(staffId !== NO_STYLIST && { staffId }),
      });
      showResultToast(res, "Walk-in booked", "Failed to book the walk-in");
      if (res.success) {
        setName("");
        setPhone("");
        setNotes("");
        setStaffId(NO_STYLIST);
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
        {stylists.length > 0 && slot && (
          <div className="space-y-1.5">
            <Label htmlFor="walk-in-stylist">Stylist (optional)</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id="walk-in-stylist" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_STYLIST}>No preference</SelectItem>
                {stylists.map((s) => {
                  const off = isOff(s, slot);
                  return (
                    <SelectItem key={s.id} value={s.id} disabled={off}>
                      {off ? `${s.name} · off then` : s.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="walk-in-notes">Notes (optional)</Label>
          <Input id="walk-in-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </div>
      </form>
    </ResponsiveDialog>
  );
}
