"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { pauseHome } from "@/services/home-service/pauseHome";
import { turnOffHome } from "@/services/home-service/turnOffHome";
import { addDays, todayDhaka } from "./format";

const PAUSE_MAX_DAYS = 90;

/** Hidden from new bookings until the morning of the chosen day; what's booked goes ahead. */
export function PauseDialog({
  salonId,
  open,
  onOpenChange,
}: {
  salonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [today] = useState(todayDhaka);
  const [until, setUntil] = useState(() => addDays(today, 7));
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  const min = addDays(today, 1);
  const max = addDays(today, PAUSE_MAX_DAYS);
  const valid = until >= min && until <= max;

  const submit = () =>
    start(async () => {
      const res = await pauseHome({ salonId, until: `${until}T00:00:00+06:00`, reason: reason.trim() || undefined });
      showResultToast(res);
      if (res.success) onOpenChange(false);
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pause Home Service"
      description="Customers can't book new visits until then. Visits already booked go ahead."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending} disabled={!valid}>
            Pause
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="home-pause-until">Back on</Label>
          <Input
            id="home-pause-until"
            type="date"
            value={until}
            min={min}
            max={max}
            onChange={(e) => setUntil(e.target.value)}
            aria-describedby="home-pause-hint"
          />
          <p id="home-pause-hint" className="text-xs text-muted-foreground">
            Up to {PAUSE_MAX_DAYS} days from today.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="home-pause-reason">Reason (optional)</Label>
          <Textarea
            id="home-pause-reason"
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
    </ResponsiveDialog>
  );
}

const CHOICES = [
  {
    value: "KEEP",
    title: "Keep them",
    text: "Booked visits go ahead. No new bookings come in.",
  },
  {
    value: "CANCEL",
    title: "Cancel them",
    text: "Customers get 100% back automatically.",
  },
] as const;

/** The owner chooses what happens to booked visits, and sees what the server actually did. */
export function TurnOffDialog({
  salonId,
  upcoming,
  open,
  onOpenChange,
}: {
  salonId: string;
  /** Confirmed visits still to come. */
  upcoming: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [choice, setChoice] = useState<"KEEP" | "CANCEL">("KEEP");
  const [pending, start] = useTransition();
  const cancelling = upcoming > 0 && choice === "CANCEL";

  const submit = () =>
    start(async () => {
      const res = await turnOffHome({ salonId, upcoming: cancelling ? "CANCEL" : "KEEP" });
      if (!res.success || !res.data) {
        showResultToast(res);
        return;
      }
      onOpenChange(false);
      if (!cancelling) {
        showResultToast(res);
        return;
      }
      const { cancelled = 0, refundedMinor = 0, notCancelled = 0, underWay = 0 } = res.data;
      toast.success(`${cancelled} ${cancelled === 1 ? "visit" : "visits"} cancelled · ${formatBDT(refundedMinor)} refunded`, {
        description:
          [
            underWay > 0 && `${underWay} already under way will go ahead.`,
            notCancelled > 0 && `${notCancelled} couldn't be cancelled. Check the Bookings tab.`,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
        duration: 10_000,
      });
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        upcoming > 0
          ? `What about ${upcoming} upcoming ${upcoming === 1 ? "booking" : "bookings"}?`
          : "Turn off Home Service?"
      }
      description="Customers won't see this branch for home visits. You can turn it on again later."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Back
          </Button>
          <Button variant={cancelling ? "destructive" : "default"} onClick={submit} loading={pending}>
            {cancelling ? "Turn off and cancel" : "Turn off"}
          </Button>
        </>
      }
    >
      {upcoming > 0 ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">Upcoming bookings</legend>
          {CHOICES.map((c) => (
            <label
              key={c.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm",
                choice === c.value ? "border-primary bg-primary-soft" : "border-border",
              )}
            >
              <input
                type="radio"
                name="home-turn-off"
                className="mt-0.5 size-4 accent-primary"
                checked={choice === c.value}
                onChange={() => setChoice(c.value)}
              />
              <span>
                <span className="block font-medium">{c.title}</span>
                <span className="text-muted-foreground">{c.text}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-sm text-muted-foreground">There are no upcoming bookings.</p>
      )}
    </ResponsiveDialog>
  );
}
