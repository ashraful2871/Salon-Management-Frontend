"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBDT } from "@/lib/money";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { cancelHomeBooking } from "@/services/home-service/cancelHomeBooking";
import { getHomeCancelQuote } from "@/services/home-service/getHomeCancelQuote";
import { rescheduleHomeBooking } from "@/services/home-service/rescheduleHomeBooking";
import type { HomeBooking, HomeCancelQuote } from "@/services/home-service/types";
import { homeErrorMessage } from "./errors";
import { dayText, timeText } from "./format";
import { DayChips, TimeGroups, useHomeSlots } from "./SlotPicker";

/** The cancel quote, loaded each time a dialog opens (it depends on the clock). */
function useCancelQuote(id: string, open: boolean) {
  // Each opening is its own request.
  const [wasOpen, setWasOpen] = useState(open);
  const [epoch, setEpoch] = useState(0);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setEpoch((e) => e + 1);
  }
  const key = open ? `${id}#${epoch}` : null;
  const [res, setRes] = useState<{ key: string; quote: HomeCancelQuote | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!key) return;
    let live = true;
    getHomeCancelQuote(id).then((r) => {
      if (!live) return;
      setRes(r.success && r.data ? { key, quote: r.data, error: null } : { key, quote: null, error: homeErrorMessage(r) });
    });
    return () => {
      live = false;
    };
  }, [id, key]);

  const current = key && res?.key === key ? res : null;
  return { quote: current?.quote ?? null, error: current?.error ?? null, loading: Boolean(key) && !current };
}

/**
 * Cancel: the server's own figures for cancelling now. Under NON_REFUNDABLE
 * the main button is "Reschedule instead", with "Cancel anyway" beside it.
 */
export function CancelDialog({
  open,
  onOpenChange,
  booking,
  onDone,
  onReschedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: HomeBooking;
  onDone: (b: HomeBooking) => void;
  onReschedule: () => void;
}) {
  const { quote, error, loading } = useCancelQuote(booking.id, open);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  const back = quote ? quote.outcome.refundMinor + quote.balanceBackMinor : 0;
  const kept = quote?.outcome.feeMinor ?? 0;
  const steer = quote?.policy === "NON_REFUNDABLE" && quote.canReschedule;

  const cancel = async () => {
    setPending(true);
    const res = await cancelHomeBooking(booking.id, reason.trim() || undefined);
    setPending(false);
    if (!res.success || !res.data) return void toast.error(homeErrorMessage(res));
    const returned = res.data.outcome.refundMinor + res.data.balanceReleasedMinor;
    toast.success(returned > 0 ? `${formatBDT(returned)} is back in your wallet` : "Booking cancelled");
    onDone(res.data.booking);
    onOpenChange(false);
  };

  const cancelButton = (
    <Button
      variant={steer ? "outline" : "destructive"}
      disabled={!quote?.canCancel || pending}
      onClick={cancel}
      className={cn(steer && "text-danger hover:text-danger")}
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {steer ? "Cancel anyway" : "Cancel booking"}
    </Button>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancel ${booking.code}?`}
      description={`${dayText(booking.serviceDate)} · ${timeText(booking.startAt)}`}
      footer={
        steer ? (
          <>
            {cancelButton}
            <Button
              onClick={() => {
                onOpenChange(false);
                onReschedule();
              }}
            >
              Reschedule instead
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Keep it
            </Button>
            {cancelButton}
          </>
        )
      }
    >
      {loading || (!quote && !error) ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Working out your refund…
        </p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        quote && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">{quote.message}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className={cn("rounded-2xl p-3", TONE_CLASSES.success.soft)}>
                <p className="text-xs text-muted-foreground">Back to your wallet</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{formatBDT(back)}</p>
              </div>
              <div className={cn("rounded-2xl p-3", kept > 0 ? TONE_CLASSES.warning.soft : "bg-muted")}>
                <p className="text-xs text-muted-foreground">Kept</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{formatBDT(kept)}</p>
              </div>
            </div>
            {!quote.canCancel && <p className="text-sm text-warning">This visit can&apos;t be cancelled any more.</p>}
            {quote.canCancel && (
              <div className="space-y-1.5">
                <Label htmlFor="hs-cancel-reason">Reason (optional)</Label>
                <Textarea
                  id="hs-cancel-reason"
                  rows={2}
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}
          </div>
        )
      )}
    </ResponsiveDialog>
  );
}

/** Reschedule: the same day chips and times as booking, with the moves left. */
export function RescheduleDialog({
  open,
  onOpenChange,
  booking,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: HomeBooking;
  onDone: (b: HomeBooking) => void;
}) {
  const { quote } = useCancelQuote(booking.id, open);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const source = useMemo(
    () =>
      open
        ? {
            offeringIds: booking.items.map((i) => i.offeringId),
            expertId: booking.expert.id,
            lat: booking.address.latitude,
            lng: booking.address.longitude,
          }
        : null,
    [open, booking.items, booking.expert.id, booking.address.latitude, booking.address.longitude],
  );
  const { days, times, reload } = useHomeSlots(source, open ? date : null);

  const left = Math.max(0, booking.policy.maxRescheduleCount - booking.rescheduleCount);
  const reason = blocked ?? (quote && !quote.canReschedule ? (quote.rescheduleBlockedReason ?? "This visit can't be moved any more.") : null);
  const same = time === booking.startAt;

  const submit = async () => {
    if (!date || !time) return;
    setPending(true);
    const res = await rescheduleHomeBooking(booking.id, { date, startAt: time }, booking.expert.id);
    setPending(false);
    if (!res.success || !res.data) {
      if (res.errorCode === "RESCHEDULE_NOT_ALLOWED") return void setBlocked(res.message || homeErrorMessage(res));
      if (res.errorCode === "SLOT_TAKEN") {
        setTime(null);
        reload();
      }
      return void toast.error(homeErrorMessage(res));
    }
    toast.success(`Moved to ${dayText(res.data.serviceDate)}, ${timeText(res.data.startAt)}`);
    onDone(res.data);
    onOpenChange(false);
    setDate(null);
    setTime(null);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Reschedule ${booking.code}`}
      description={
        reason
          ? undefined
          : `${left} change${left === 1 ? "" : "s"} left. Now: ${dayText(booking.serviceDate)}, ${timeText(booking.startAt)}.`
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!reason && (
            <Button disabled={!date || !time || same || pending} onClick={submit}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Move my visit
            </Button>
          )}
        </>
      }
    >
      {reason ? (
        <p className={cn("rounded-2xl p-4 text-sm", TONE_CLASSES.warning.soft, TONE_CLASSES.warning.text)}>{reason}</p>
      ) : (
        <div className="space-y-5">
          <DayChips
            days={days.data?.days ?? null}
            loading={days.loading}
            error={days.error}
            value={date}
            onChange={(d) => (setDate(d), setTime(null))}
          />
          {date && (
            <TimeGroups
              slots={times.data}
              loading={times.loading}
              error={times.error}
              value={time}
              onChange={(s) => setTime(s.startAt)}
            />
          )}
          <p className="text-xs text-muted-foreground">Your advance stays as it is. The same expert comes at the new time.</p>
        </div>
      )}
    </ResponsiveDialog>
  );
}
