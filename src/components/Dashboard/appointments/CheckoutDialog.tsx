"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { formatBDT } from "@/lib/money";
import type { Appointment, CounterPaymentMethod } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { COUNTER_PAYMENT_METHODS } from "./format";
import type { AppointmentActions } from "./useAppointmentActions";

export const CheckoutDialog = ({
  appointment,
  open,
  onOpenChange,
  onDone,
  complete,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => unknown;
  complete: AppointmentActions["complete"];
}) => {
  const [method, setMethod] = useState<CounterPaymentMethod>("CASH");
  const [reference, setReference] = useState("");
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

  // The row shows the booking completed at once and spins until the server
  // answers (a failure puts it back and says why), so the dialog closes now.
  // The action ignores a second click for a booking already in flight.
  const handleConfirm = () => {
    if (!appointment) return;
    // The API always wants a method; with nothing due no payment row is
    // written, so the choice is moot.
    complete(
      appointment,
      {
        paymentMethod: nothingToCollect ? "CASH" : method,
        reference: takesReference ? reference.trim() || undefined : undefined,
      },
      onDone,
    );
    handleOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={nothingToCollect ? "Complete booking" : "Complete & collect"}
      description={
        <>
          {appointment?.serialNumber != null && `#${appointment.serialNumber} · `}
          {appointment?.service?.name ?? "Service"} for {customerName}
        </>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!appointment}>
            {nothingToCollect ? "Complete" : `Confirm · collect ${formatBDT(dueMinor)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2 rounded-xl border border-border bg-surface-subtle p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium tabular-nums">{formatBDT(totalMinor)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Deposit already paid (wallet)</span>
            <span className="whitespace-nowrap font-medium tabular-nums">
              − {formatBDT(depositPaidMinor)}
            </span>
          </div>
          {paidAtCounterMinor > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Already paid at counter</span>
              <span className="whitespace-nowrap font-medium tabular-nums">
                − {formatBDT(paidAtCounterMinor)}
              </span>
            </div>
          )}
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
            <span className="font-semibold">Collect now</span>
            <span className="text-3xl font-bold tabular-nums text-primary-hover">
              {formatBDT(dueMinor)}
            </span>
          </div>
        </div>

        {nothingToCollect ? (
          <p className="text-center text-sm text-muted-foreground">
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
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-xl border py-3 text-center text-xs transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    method === m.value
                      ? "border-primary/50 bg-primary-soft font-semibold text-primary-hover"
                      : "border-border hover:bg-surface-subtle",
                  )}
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
      </div>
    </ResponsiveDialog>
  );
};
