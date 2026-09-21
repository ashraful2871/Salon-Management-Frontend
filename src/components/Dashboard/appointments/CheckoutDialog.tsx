"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBDT } from "@/lib/money";
import type { Appointment, CounterPaymentMethod } from "@/lib/api-types";
import { checkoutAppointment } from "@/services/appoinments/checkoutAppointment";
import { showResultToast } from "@/components/Shared/showResultToast";
import { COUNTER_PAYMENT_METHODS } from "./format";

export const CheckoutDialog = ({
  appointment,
  open,
  onOpenChange,
  onDone,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) => {
  const [method, setMethod] = useState<CounterPaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [isPending, startTransition] = useTransition();
  // `isPending` only disables the button after a re-render; this closes the
  // gap so a fast double click still sends one checkout.
  const submitting = useRef(false);
  const router = useRouter();
  const radioName = useId();

  const totalMinor = appointment?.totalMinor ?? 0;
  const depositPaidMinor = appointment?.depositPaidMinor ?? 0;
  const paidAtCounterMinor = appointment?.paidAtCounterMinor ?? 0;
  const dueMinor = appointment?.amountDueMinor ?? 0;
  const nothingToCollect = dueMinor === 0;
  const takesReference = !nothingToCollect && method !== "CASH";

  const customerName =
    appointment?.customer?.name || appointment?.customer?.email || "the customer";

  const reset = () => {
    setMethod("CASH");
    setReference("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (!appointment || submitting.current) return;
    submitting.current = true;
    startTransition(async () => {
      // The API always wants a method; with nothing due no payment row is
      // written, so the choice is moot.
      const res = await checkoutAppointment(appointment.id, {
        paymentMethod: nothingToCollect ? "CASH" : method,
        reference: takesReference ? reference.trim() || undefined : undefined,
      });
      submitting.current = false;
      showResultToast(
        res,
        nothingToCollect
          ? "Booking completed"
          : `Collected ${formatBDT(res.data?.collectedMinor ?? dueMinor)} · booking completed`,
        "Failed to complete the booking",
      );
      if (res.success) {
        handleOpenChange(false);
        onDone?.();
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] overflow-hidden rounded-2xl p-0">
        <div className="p-6 pb-4 border-b bg-primary/5">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {nothingToCollect ? "Complete booking" : "Complete & collect"}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {appointment?.serialNumber != null && `#${appointment.serialNumber} · `}
              {appointment?.service?.name ?? "Service"} for {customerName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium tabular-nums">{formatBDT(totalMinor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit already paid (wallet)</span>
              <span className="font-medium tabular-nums">
                − {formatBDT(depositPaidMinor)}
              </span>
            </div>
            {paidAtCounterMinor > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already paid at counter</span>
                <span className="font-medium tabular-nums">
                  − {formatBDT(paidAtCounterMinor)}
                </span>
              </div>
            )}
            <div className="flex items-end justify-between border-t pt-3 mt-3">
              <span className="font-semibold">Collect now</span>
              <span className="text-3xl font-bold tabular-nums text-primary">
                {formatBDT(dueMinor)}
              </span>
            </div>
          </div>

          {nothingToCollect ? (
            <p className="text-sm text-muted-foreground text-center">
              Nothing to collect - the deposit covers the bill.
            </p>
          ) : (
            <div className="space-y-3">
              <div
                role="radiogroup"
                aria-label="Payment method"
                className="grid grid-cols-3 gap-2"
              >
                {COUNTER_PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-xs cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                      method === m.value
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={radioName}
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                      className="sr-only"
                    />
                    <span className="text-xl" aria-hidden>
                      {m.icon}
                    </span>
                    {m.label}
                  </label>
                ))}
              </div>
              {takesReference && (
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={100}
                  placeholder={
                    method === "CARD"
                      ? "Card slip / approval no. (optional)"
                      : "Transaction ID (optional)"
                  }
                  aria-label="Payment reference"
                />
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || !appointment}
            >
              {isPending
                ? "Completing..."
                : nothingToCollect
                  ? "Complete"
                  : `Confirm · collect ${formatBDT(dueMinor)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
