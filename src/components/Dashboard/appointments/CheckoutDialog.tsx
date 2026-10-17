"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { formatBDT, toMinor } from "@/lib/money";
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
  // Checkout v2: an optional tip (the salon's own, never commissioned) and an
  // optional discount off the bill, which needs a reason for the audit log.
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const radioName = useId();
  const fieldId = useId();

  const totalMinor = appointment?.totalMinor ?? 0;
  const depositPaidMinor = appointment?.depositPaidMinor ?? 0;
  // Owner Phase 15: the rest of the bill paid in the app; then ৳0 is due here.
  const prepaidPaidMinor = appointment?.prepaidPaidMinor ?? 0;
  const paidAtCounterMinor = appointment?.paidAtCounterMinor ?? 0;
  const billDueMinor = appointment?.amountDueMinor ?? 0;

  const takaToMinor = (value: string) => {
    const n = Number(value);
    return value.trim() !== "" && Number.isFinite(n) && n > 0 ? toMinor(n) : 0;
  };
  const tipMinor = showTip ? takaToMinor(tip) : 0;
  const discountMinor = showDiscount ? takaToMinor(discount) : 0;
  // A deposit or counter money already taken can't be discounted away.
  const discountTooBig = discountMinor > billDueMinor;
  const discountNeedsReason = discountMinor > 0 && discountReason.trim().length < 3;
  const dueMinor = Math.max(billDueMinor - discountMinor, 0) + tipMinor;
  const nothingToCollect = dueMinor === 0;
  const takesReference = !nothingToCollect && method !== "CASH";
  const blocked = discountTooBig || discountNeedsReason;

  const customerName =
    appointment?.customer?.name || appointment?.customer?.email || "the customer";

  const reset = () => {
    setMethod("CASH");
    setReference("");
    setShowTip(false);
    setTip("");
    setShowDiscount(false);
    setDiscount("");
    setDiscountReason("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // The row shows the booking completed at once and spins until the server
  // answers (a failure puts it back and says why), so the dialog closes now.
  // The action ignores a second click for a booking already in flight.
  const handleConfirm = () => {
    if (!appointment || blocked) return;
    // The API always wants a method; with nothing due no payment row is
    // written, so the choice is moot.
    complete(
      appointment,
      {
        paymentMethod: nothingToCollect ? "CASH" : method,
        reference: takesReference ? reference.trim() || undefined : undefined,
        ...(tipMinor > 0 && { tipMinor }),
        ...(discountMinor > 0 && {
          discountMinor,
          discountReason: discountReason.trim(),
        }),
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
          <Button onClick={handleConfirm} disabled={!appointment || blocked}>
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
            <span className="text-muted-foreground">
              {prepaidPaidMinor > 0 ? "Paid in app (wallet)" : "Deposit already paid (wallet)"}
            </span>
            <span className="whitespace-nowrap font-medium tabular-nums">
              − {formatBDT(depositPaidMinor + prepaidPaidMinor)}
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
          {discountMinor > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Discount</span>
              <span className="whitespace-nowrap font-medium tabular-nums">
                − {formatBDT(discountMinor)}
              </span>
            </div>
          )}
          {tipMinor > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Tip</span>
              <span className="whitespace-nowrap font-medium tabular-nums">
                + {formatBDT(tipMinor)}
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

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={showTip ? "secondary" : "outline"}
            size="sm"
            aria-expanded={showTip}
            onClick={() => setShowTip((v) => !v)}
          >
            {showTip ? "Remove tip" : "Add tip"}
          </Button>
          {billDueMinor > 0 && (
            <Button
              type="button"
              variant={showDiscount ? "secondary" : "outline"}
              size="sm"
              aria-expanded={showDiscount}
              onClick={() => setShowDiscount((v) => !v)}
            >
              {showDiscount ? "Remove discount" : "Discount"}
            </Button>
          )}
        </div>

        {showTip && (
          <div className="space-y-1.5">
            <label htmlFor={`${fieldId}-tip`} className="text-sm font-medium">
              Tip (৳)
            </label>
            <Input
              id={`${fieldId}-tip`}
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Goes to the salon in full - no commission.</p>
          </div>
        )}

        {showDiscount && (
          <div className="space-y-2">
            <div className="space-y-1.5">
              <label htmlFor={`${fieldId}-discount`} className="text-sm font-medium">
                Discount (৳)
              </label>
              <Input
                id={`${fieldId}-discount`}
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                aria-invalid={discountTooBig || undefined}
              />
              {discountTooBig && (
                <p role="alert" className="text-xs text-danger">
                  At most {formatBDT(billDueMinor)} - the bill less what is already paid.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${fieldId}-reason`} className="text-sm font-medium">
                Reason
              </label>
              <Input
                id={`${fieldId}-reason`}
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                maxLength={200}
                placeholder="e.g. Regular customer, service ran late"
                aria-invalid={discountNeedsReason || undefined}
              />
              {discountNeedsReason && (
                <p className="text-xs text-muted-foreground">A reason is required for a discount.</p>
              )}
            </div>
          </div>
        )}

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
