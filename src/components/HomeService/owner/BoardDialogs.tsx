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

/**
 * Pick an expert. The API lists every expert of the branch on the visit's
 * side: the free ones can be picked, the rest are shown greyed out with why
 * (busy, off shift, doesn't do a service, ...). Nobody of the wrong side is listed. "assign" gives an "any available expert" visit its
 * first expert (no reason; the customer is emailed the name); "reassign" moves
 * an assigned one and keeps a reason. Mounted per open.
 */
export function ExpertPickDialog({
  mode,
  booking,
  open,
  onOpenChange,
  onConfirm,
}: {
  mode: "assign" | "reassign";
  booking: OwnerHomeBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expert: HomeReassignCandidate, reason: string) => void;
}) {
  const assigning = mode === "assign";
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

  const chosen = candidates?.find((c) => c.id === expertId && c.available);
  const valid = !!chosen && (assigning || reason.trim().length >= REASON_MIN);
  const free = candidates?.filter((c) => c.available) ?? [];
  const busy = candidates?.filter((c) => !c.available) ?? [];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={assigning ? "Assign an expert" : "Reassign this visit"}
      description={
        assigning
          ? `${booking.customerName.split(" ")[0]} chose any available expert. Pick someone who is free at that time and does every service. We email the customer their name, and the visit appears in the expert's jobs.`
          : `Now with ${booking.expert.name}. Pick someone who is free at that time and does every service.`
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button disabled={!valid} onClick={() => chosen && onConfirm(chosen, reason.trim())}>
            {assigning ? "Assign" : "Reassign"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {loading || (!candidates && !error) ? (
          <p className="text-sm text-muted-foreground">Checking your experts…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : candidates?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This branch has no {booking.audience === "GENTS" ? "Gents" : "Ladies"} home experts yet. Add one under Home
            Service → Experts.
          </p>
        ) : (
          <fieldset className="space-y-4">
            <legend className="sr-only">Expert</legend>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-success">
                Free at that time ({free.length})
              </p>
              {free.length ? (
                free.map((c) => (
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.completedJobs} visit{c.completedJobs === 1 ? "" : "s"} done
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">★ {formatRating(c.rating)}</span>
                  </label>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                  {assigning
                    ? "Nobody is free at that time. Reschedule with the customer or cancel the visit."
                    : "No other expert is free at that time."}
                </p>
              )}
            </div>

            {busy.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Not available ({busy.length})
                </p>
                {busy.map((c) => (
                  <label
                    key={c.id}
                    aria-disabled="true"
                    className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl border border-border bg-surface-subtle p-2.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="home-reassign"
                      className="size-4 shrink-0"
                      disabled
                      checked={false}
                      readOnly
                      aria-describedby={`home-reassign-why-${c.id}`}
                    />
                    <ExpertAvatar name={c.name} photo={c.photo} className="size-8 text-xs opacity-60" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-muted-foreground">{c.name}</span>
                      <span
                        id={`home-reassign-why-${c.id}`}
                        className={cn(
                          "block text-xs",
                          c.reasonCode === "CURRENT" ? "text-primary" : "text-danger",
                        )}
                      >
                        {c.reason ?? "Not free at that time"}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">★ {formatRating(c.rating)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )}
        {free.length > 0 && !assigning && (
          <ReasonField id="home-reassign-reason" value={reason} onChange={setReason} />
        )}
      </div>
    </ResponsiveDialog>
  );
}
