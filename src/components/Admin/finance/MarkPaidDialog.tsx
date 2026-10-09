"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { updatePayout } from "@/services/admin/finance/updatePayout";
import { isApprovalRequired, type AdminPayout } from "@/services/admin/finance/types";

const METHODS = [
  { value: "BKASH", label: "bKash" },
  { value: "BANK", label: "Bank transfer" },
] as const;

/**
 * Mark paid: the transfer reference is required (the API refuses without
 * one), method too, and a proof link is optional. With four-eyes on, the
 * answer is "Sent for approval" and the payout stays where it is.
 */
export function MarkPaidDialog({
  payout,
  onOpenChange,
}: {
  payout: AdminPayout | null;
  onOpenChange: (open: boolean) => void;
}) {
  const ids = useId();
  const [method, setMethod] = useState<"BKASH" | "BANK" | "">("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const reset = () => {
    setMethod("");
    setReference("");
    setProofUrl("");
    setError(null);
  };

  const ready = !!method && reference.trim().length > 0;

  const submit = () =>
    startTransition(async () => {
      if (!payout || !method) return;
      setError(null);
      const result = await run(() =>
        updatePayout(payout.id, {
          status: "PAID",
          method,
          reference: reference.trim(),
          proofUrl: proofUrl.trim() || undefined,
        }),
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (isApprovalRequired(result.data)) {
        toast.success("Sent for approval", {
          description: "Another admin has to approve it before the payout is marked paid.",
        });
      } else {
        toast.success("Payout marked paid", { description: "The salon owner gets an email." });
      }
      reset();
      onOpenChange(false);
    });

  return (
    <>
      <ResponsiveDialog
        open={!!payout}
        onOpenChange={(next) => {
          if (pending) return;
          if (!next) reset();
          onOpenChange(next);
        }}
        title="Mark payout paid"
        description={payout ? `${formatBDT(payout.netMinor)} to ${payout.salon.name}` : undefined}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!ready || pending}>
              {pending ? "Saving…" : "Mark paid"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Sent by</legend>
            <div className="flex gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={method === m.value}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    method === m.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:bg-muted",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-ref`}>Transfer reference *</Label>
            <Input
              id={`${ids}-ref`}
              value={reference}
              maxLength={120}
              onChange={(e) => setReference(e.target.value)}
              placeholder="bKash TrxID or bank reference"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-proof`}>Proof link (optional)</Label>
            <Input
              id={`${ids}-proof`}
              type="url"
              value={proofUrl}
              maxLength={500}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </ResponsiveDialog>
      {dialog}
    </>
  );
}
