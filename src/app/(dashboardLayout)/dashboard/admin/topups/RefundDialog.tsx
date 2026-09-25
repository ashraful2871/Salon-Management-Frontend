"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "@/components/Wallet/CopyButton";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT, toMinor, toTaka } from "@/lib/money";
import { providerLabel } from "@/lib/payment-providers";
import type { AdminTopup } from "@/services/payments/getAdminTopups";
import { refundTopup } from "@/services/payments/refundTopup";

const REASON_MIN = 3;
const REASON_MAX = 255;

/** The API's validation errors come as a list under `errorDetails`; show them too. */
const describeError = (result: ApiResponse<unknown>) => {
  const details = result.errorDetails as unknown;
  if (Array.isArray(details)) {
    const messages = details
      .map((detail) => (detail as { message?: string })?.message)
      .filter(Boolean);
    if (messages.length) return `${result.message}: ${messages.join("; ")}`;
  }
  return result.message;
};

const SummaryRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right">{children}</dd>
  </>
);

export function RefundDialog({
  topup,
  onClose,
}: {
  topup: AdminTopup;
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = topup.remainingMinor;
  const method = providerLabel(topup.provider);
  const customer = topup.customer.name || topup.customer.email;
  const refLabel = topup.provider === "BKASH" ? "Refund TrxID" : "Refund reference";

  // Empty means "everything that is left".
  const typed = amount.trim();
  let amountMinor = remaining;
  let amountError: string | null = null;
  if (typed) {
    if (!/^\d+(\.\d{1,2})?$/.test(typed)) {
      amountError = "Enter an amount in taka, with at most two decimals";
    } else {
      amountMinor = toMinor(Number(typed));
      if (amountMinor <= 0) amountError = "The amount must be more than ৳0";
      else if (amountMinor > remaining)
        amountError = `Only ${formatBDT(remaining)} is left to refund`;
    }
  }

  const reasonLength = reason.trim().length;
  const reasonError =
    reasonLength < REASON_MIN
      ? `Give a reason of at least ${REASON_MIN} characters`
      : reasonLength > REASON_MAX
        ? `Keep the reason under ${REASON_MAX} characters`
        : null;

  const canSubmit = !sending && !amountError && !reasonError;

  const send = async () => {
    setSending(true);
    setError(null);

    const result = await refundTopup(topup.id, {
      amount: typed ? Number(typed) : undefined,
      reason: reason.trim(),
    });

    setSending(false);
    router.refresh();

    if (result.success && result.data?.status === "COMPLETED") {
      toast.success("Refund sent", {
        description: result.data.refundRef
          ? `${refLabel} ${result.data.refundRef}`
          : undefined,
      });
      onClose();
    } else if (result.success) {
      toast.warning(result.message, { duration: Infinity });
      onClose();
    } else {
      setError(describeError(result));
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // Closing mid-send would hide the only place its outcome is shown.
        if (!open && !sending) onClose();
      }}
    >
      <DialogContent showCloseButton={!sending} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refund top-up</DialogTitle>
          <DialogDescription>
            The money goes back to the customer&apos;s {method} and leaves their wallet
            at once.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
          <SummaryRow label="Customer">
            <span className="font-medium">{topup.customer.name || "—"}</span>
            <span className="block text-xs text-muted-foreground">{topup.customer.email}</span>
          </SummaryRow>
          <SummaryRow label="Method">{method}</SummaryRow>
          <SummaryRow label="Txn ID">
            <span className="flex items-center justify-end gap-1">
              <span className="truncate font-mono text-xs">{topup.transactionId}</span>
              <CopyButton value={topup.transactionId} />
            </span>
          </SummaryRow>
          <SummaryRow label="Top-up amount">{formatBDT(topup.amountMinor)}</SummaryRow>
          <SummaryRow label="Already refunded">
            {topup.refundedMinor > 0 ? formatBDT(topup.refundedMinor) : "—"}
          </SummaryRow>
          <SummaryRow label="Remaining">
            <span className="font-semibold">{formatBDT(remaining)}</span>
          </SummaryRow>
          <SummaryRow label="Customer's available balance">
            <span className="font-semibold">{formatBDT(topup.availableMinor)}</span>
          </SummaryRow>
        </dl>

        {topup.availableMinor < remaining ? (
          <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The customer has only {formatBDT(topup.availableMinor)} available. A
              larger refund will be refused before anything is sent to the gateway.
            </span>
          </p>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            // The disabled submit button is the client-side guard (it also
            // stops Enter); the API validates again whatever gets past it.
            e.preventDefault();
            setConfirmOpen(true);
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="refund-amount">Amount (৳)</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                disabled={sending}
                onClick={() => setAmount(String(toTaka(remaining)))}
              >
                Full remaining
              </Button>
            </div>
            <Input
              id="refund-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder={String(toTaka(remaining))}
              value={amount}
              disabled={sending}
              aria-invalid={amountError ? true : undefined}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className={amountError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {amountError ?? "Leave empty to refund everything that is left."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="refund-reason">Reason</Label>
              <span className="text-xs text-muted-foreground">
                {reasonLength}/{REASON_MAX}
              </span>
            </div>
            <Textarea
              id="refund-reason"
              value={reason}
              maxLength={REASON_MAX}
              disabled={sending}
              placeholder="Why is this top-up being refunded?"
              aria-invalid={reasonTouched && reasonError ? true : undefined}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setReasonTouched(true)}
            />
            {reasonTouched && reasonError ? (
              <p className="text-xs text-destructive">{reasonError}</p>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={sending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                `Refund ${formatBDT(amountMinor)}`
              )}
            </Button>
          </DialogFooter>
        </form>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Send {formatBDT(amountMinor)} back to {customer}&apos;s {method}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                It is taken out of their wallet now and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={send}>
                Refund {formatBDT(amountMinor)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
