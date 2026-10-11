"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatBDT, toMinor } from "@/lib/money";
import { adjustWallet } from "@/services/admin/finance/adjustWallet";
import { isApprovalRequired } from "@/services/admin/finance/types";

const AMOUNT = /^-?\d+(\.\d{1,2})?$/;

/**
 * A signed manual adjustment: positive credits, negative debits. The
 * idempotency key is minted when the dialog opens, so the retry after step-up
 * (or a double click) cannot apply twice. Debits and large credits go to a
 * second admin when four-eyes is on.
 */
export function AdjustWalletDialog({
  open,
  onOpenChange,
  userId,
  name,
  balanceMinor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  name: string;
  balanceMinor: number;
}) {
  const ids = useId();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  // Mounted only while open: one key per opening, kept across the step-up retry.
  const [key] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const valid = AMOUNT.test(amount.trim()) && Number(amount) !== 0;
  const minor = valid ? toMinor(Number(amount)) : 0;
  const ready = valid && reason.trim().length >= 3;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await run(() =>
        adjustWallet({ userId, amount: Number(amount), reason: reason.trim(), idempotencyKey: key }),
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (isApprovalRequired(result.data)) {
        toast.success("Sent for approval", {
          description: "Another admin has to approve this adjustment before the wallet moves.",
        });
      } else {
        toast.success(`${minor < 0 ? "Debited" : "Credited"} ${formatBDT(Math.abs(minor))}`);
      }
      onOpenChange(false);
    });

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => !pending && onOpenChange(next)}
        title="Adjust wallet"
        description={`${name} · balance ${formatBDT(balanceMinor)}`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!ready || pending} variant={minor < 0 ? "destructive" : "default"}>
              {pending ? "Saving…" : minor < 0 ? `Debit ${formatBDT(-minor)}` : minor > 0 ? `Credit ${formatBDT(minor)}` : "Adjust"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-amount`}>Amount in taka (negative to debit)</Label>
            <Input
              id={`${ids}-amount`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 250 or -100"
              aria-invalid={amount !== "" && !valid}
            />
            {amount !== "" && !valid && (
              <p className="text-xs text-danger">Enter a non-zero amount with at most two decimals.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-reason`}>Reason *</Label>
            <Textarea
              id={`${ids}-reason`}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What happened, and any ticket or reference"
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
