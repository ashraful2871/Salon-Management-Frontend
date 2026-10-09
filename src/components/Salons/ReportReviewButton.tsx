"use client";

import { useId, useState, useTransition } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { REPORT_REASON_LABELS } from "@/components/Admin/reviews/labels";
import { cn } from "@/lib/utils";
import { reportReview, type ReviewReportReason } from "@/services/review/reportReview";

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReviewReportReason[];

/**
 * "Report" on one review: a signed-in customer, or the salon's owner, sends it
 * to the moderators with a reason. The review stays up until an admin acts.
 */
export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReviewReportReason | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!reason) {
      setError("Choose a reason.");
      return;
    }
    startTransition(async () => {
      const result = await reportReview(reviewId, { reason, note });
      if (result.success) {
        toast.success("Thanks — we'll take a look");
        setOpen(false);
        setReason("");
        setNote("");
        setError(null);
      } else {
        setError(result.message || "Couldn't send your report.");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Report
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) setOpen(next);
        }}
        title="Report this review"
        description="Tell us what's wrong. Our team checks every report; the reviewer is never told who reported it."
        footer={
          <>
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={submit}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Send report
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Reason</legend>
            {REASONS.map((value) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                  reason === value ? "border-primary bg-primary-soft" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name={`${ids}-reason`}
                  value={value}
                  checked={reason === value}
                  onChange={() => {
                    setReason(value);
                    setError(null);
                  }}
                  className="accent-primary"
                />
                {REPORT_REASON_LABELS[value]}
              </label>
            ))}
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-note`}>Anything else? (optional)</Label>
            <Textarea
              id={`${ids}-note`}
              maxLength={500}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
}
