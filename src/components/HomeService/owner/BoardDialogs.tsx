"use client";

import { useEffect, useState, useTransition } from "react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import { getHomeReassignCandidates } from "@/services/home-service/getHomeReassignCandidates";
import type { HomeReassignCandidate, OwnerHomeBooking } from "@/services/home-service/types";
import { ExpertAvatar } from "../HomeCards";

const REASON_MIN = 3;

function ReasonField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Reason</Label>
      <Textarea id={id} value={value} maxLength={300} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** A board action that only needs a reason. Mounted per open. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= REASON_MIN;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!valid}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <ReasonField id="home-board-reason" value={reason} onChange={setReason} />
    </ResponsiveDialog>
  );
}

/** The API's list of who is free and able, so nobody of the wrong side can be picked. Mounted per open. */
export function ReassignDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
}: {
  booking: OwnerHomeBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expert: HomeReassignCandidate, reason: string) => void;
}) {
  const [candidates, setCandidates] = useState<HomeReassignCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expertId, setExpertId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, load] = useTransition();

  useEffect(() => {
    load(async () => {
      const res = await getHomeReassignCandidates(booking.id);
      if (res.success) setCandidates(res.data ?? []);
      else setError(res.message);
    });
  }, [booking.id]);

  const chosen = candidates?.find((c) => c.id === expertId);
  const valid = !!chosen && reason.trim().length >= REASON_MIN;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reassign this visit"
      description={`Now with ${booking.expert.name}. Only experts of the same side who are free then and do every service are listed.`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button disabled={!valid} onClick={() => chosen && onConfirm(chosen, reason.trim())}>
            Reassign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {loading || (!candidates && !error) ? (
          <p className="text-sm text-muted-foreground">Finding free experts…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : candidates?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other expert is free at that time.</p>
        ) : (
          <fieldset className="space-y-2">
            <legend className="sr-only">Expert</legend>
            {candidates?.map((c) => (
              <label
                key={c.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-sm",
                  expertId === c.id ? "border-primary bg-primary-soft" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="home-reassign"
                  className="size-4 shrink-0 accent-primary"
                  checked={expertId === c.id}
                  onChange={() => setExpertId(c.id)}
                />
                <ExpertAvatar name={c.name} photo={c.photo} className="size-8 text-xs" />
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-muted-foreground">★ {formatRating(c.rating)}</span>
              </label>
            ))}
          </fieldset>
        )}
        {!!candidates?.length && <ReasonField id="home-reassign-reason" value={reason} onChange={setReason} />}
      </div>
    </ResponsiveDialog>
  );
}
