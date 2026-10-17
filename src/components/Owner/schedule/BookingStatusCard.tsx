"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CirclePause, CirclePlay, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { pauseBookings, resumeBookings } from "@/services/schedule/scheduleActions";
import type { BookingPauseState } from "@/services/schedule/schedule-types";

const whenLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

/**
 * Manage salon → Booking status (owner only). Pause / resume online bookings;
 * walk-ins and existing bookings carry on. A dues pause is the platform's and
 * is shown read-only, with the way out (Money).
 */
export function BookingStatusCard({ salonId, pause }: { salonId: string; pause: BookingPauseState }) {
  const [state, setState] = useState(pause);
  const [synced, setSynced] = useState(pause);
  // A fresh server value (after a write elsewhere) wins over local state.
  if (synced !== pause) {
    setSynced(pause);
    setState(pause);
  }
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const resume = () =>
    startTransition(async () => {
      const res = await resumeBookings(salonId);
      if (res.success && res.data) setState(res.data);
      else if (res.errorCode === "DUES_PAUSED") setState((s) => ({ ...s, bookingPause: "DUES" }));
      showResultToast(res, "Online bookings resumed", "Couldn't resume bookings");
    });

  if (state.bookingPause === "DUES") {
    return (
      <Card className="border-danger/30 bg-danger-soft">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Wallet className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
            <div>
              <p className="font-medium">Online bookings are paused for unpaid dues</p>
              <p className="text-sm text-muted-foreground">
                They restart on their own once your dues are paid. Walk-ins still work.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/money">Pay dues</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const paused = state.bookingPause === "OWNER";

  return (
    <Card className={paused ? "border-warning/40 bg-warning-soft" : undefined}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          {paused ? (
            <CirclePause className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          ) : (
            <CirclePlay className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          )}
          <div>
            <p className="font-medium">{paused ? "Online bookings paused" : "Taking online bookings"}</p>
            <p className="text-sm text-muted-foreground">
              {paused
                ? [
                    state.bookingPauseReason,
                    state.bookingPauseUntil ? `until ${whenLabel(state.bookingPauseUntil)}` : "until you resume",
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Customers can book on the web and in the chat."}
            </p>
          </div>
        </div>
        {paused ? (
          <Button size="sm" onClick={resume} loading={pending}>
            Resume bookings
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Pause bookings
          </Button>
        )}
      </CardContent>
      <PauseDialog salonId={salonId} open={open} onOpenChange={setOpen} onPaused={setState} />
    </Card>
  );
}

function PauseDialog({
  salonId,
  open,
  onOpenChange,
  onPaused,
}: {
  salonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaused: (state: BookingPauseState) => void;
}) {
  const [reason, setReason] = useState("");
  // "YYYY-MM-DDTHH:mm" in Dhaka wall-clock time; empty = until I resume.
  const [until, setUntil] = useState("");
  const [pending, startTransition] = useTransition();
  // A rough "in the future" check for the form; the API checks against its own clock.
  const [mountedAt] = useState(() => Date.now());

  const untilIso = until ? `${until}:00+06:00` : undefined;
  const untilOk = !untilIso || Date.parse(untilIso) > mountedAt;
  const valid = reason.trim().length >= 2 && untilOk;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    startTransition(async () => {
      const res = await pauseBookings(salonId, { reason: reason.trim(), until: untilIso });
      showResultToast(res, "Online bookings paused", "Couldn't pause bookings");
      if (res.success && res.data) {
        onPaused(res.data);
        setReason("");
        setUntil("");
        onOpenChange(false);
      }
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pause online bookings"
      description="New web and chat bookings stop. Existing bookings and walk-ins carry on."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="pause-form" loading={pending} disabled={!valid}>
            Pause bookings
          </Button>
        </>
      }
    >
      <form id="pause-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pause-reason">Reason</Label>
          <Input
            id="pause-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Short-staffed this week, fully booked…"
            required
          />
          <p className="text-xs text-muted-foreground">For your records; customers only see that you are not taking online bookings.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pause-until">Resume automatically (optional)</Label>
          <Input id="pause-until" type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
          <p className="text-xs text-muted-foreground">Dhaka time. Leave empty to resume by hand. Lifted within the hour.</p>
          {!untilOk && <p className="text-xs text-danger">Pick a time in the future.</p>}
        </div>
      </form>
    </ResponsiveDialog>
  );
}
