"use client";

import React, { useEffect, useId, useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { initiateTopup } from "@/services/wallet/initiateTopup";
import {
  getPaymentMethods,
  type PaymentMethodOption,
} from "@/services/payments/getPaymentMethods";
import PaymentMethodPicker from "./PaymentMethodPicker";
import {
  providerLabel,
  TOPUP_METHOD_KEY,
  type ProviderId,
} from "@/lib/payment-providers";
import { formatBDT, toMinor } from "@/lib/money";

const PRESET_AMOUNTS = [200, 500, 1000, 2000];
/** Used only if the backend's method omits its limits. */
const FALLBACK_MIN = 100;
const FALLBACK_MAX = 50000;

type MethodsState =
  | { status: "loading" }
  | { status: "ready"; methods: PaymentMethodOption[] }
  | { status: "unavailable" };

const readSavedMethod = (): string | null => {
  try {
    return window.localStorage.getItem(TOPUP_METHOD_KEY);
  } catch {
    return null;
  }
};

const saveMethod = (id: ProviderId) => {
  try {
    window.localStorage.setItem(TOPUP_METHOD_KEY, id);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
};

export default function TopUpModal({
  open,
  setOpen,
  initialMethod,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  /** Preselects this method if it is switched on ("Try another method"). */
  initialMethod?: ProviderId;
}) {
  const [amount, setAmount] = useState<string>("500");
  const [isPending, startTransition] = useTransition();
  const [methodsState, setMethodsState] = useState<MethodsState>({
    status: "loading",
  });
  const [method, setMethod] = useState<ProviderId | null>(null);
  const amountId = useId();

  // Read on every open, uncached, so a gateway switched off on the backend
  // disappears from the dialog straight away.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getPaymentMethods().then((res) => {
      if (cancelled) return;
      const enabled = res.success
        ? (res.data ?? []).filter((m) => m.enabled)
        : [];
      if (enabled.length === 0) {
        setMethodsState({ status: "unavailable" });
        setMethod(null);
        return;
      }
      const isEnabled = (id: string | null | undefined): id is ProviderId =>
        !!id && enabled.some((m) => m.id === id);
      const saved = readSavedMethod();
      setMethod(
        isEnabled(initialMethod)
          ? initialMethod
          : isEnabled(saved)
            ? saved
            : enabled[0].id
      );
      setMethodsState({ status: "ready", methods: enabled });
    });
    return () => {
      cancelled = true;
    };
  }, [open, initialMethod]);

  const handleOpenChange = (val: boolean) => {
    // Back to the skeleton, so the next open never flashes a stale list.
    if (!val) setMethodsState({ status: "loading" });
    setOpen(val);
  };

  const selected =
    methodsState.status === "ready"
      ? (methodsState.methods.find((m) => m.id === method) ?? null)
      : null;
  const min = selected?.min ?? FALLBACK_MIN;
  const max = selected?.max ?? FALLBACK_MAX;
  const amountValue = Number(amount);
  const hasAmount = amount !== "" && Number.isFinite(amountValue) && amountValue > 0;
  const amountLabel = hasAmount ? formatBDT(toMinor(amountValue)) : "";

  const handleTopup = () => {
    if (!selected) return;
    const val = Number(amount);
    if (isNaN(val) || val < min) {
      toast.error(`Minimum top-up is ${formatBDT(toMinor(min))}`);
      return;
    }
    if (val > max) {
      toast.error(`Maximum top-up is ${formatBDT(toMinor(max))}`);
      return;
    }

    const provider = selected.id;
    startTransition(async () => {
      saveMethod(provider);
      const res = await initiateTopup(val, provider);
      if (res.success && res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        toast.error(res.message || "Failed to initiate top-up");
      }
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => !isPending && handleOpenChange(val)}
      title="Top up your wallet"
      description="Book instantly from your balance, with no gateway on the way."
      className="sm:max-w-[440px]"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTopup}
            disabled={!selected || !hasAmount || amountValue < min}
            loading={isPending}
          >
            {isPending
              ? "Opening the gateway…"
              : selected
                ? `Pay ${amountLabel || "৳0"} with ${providerLabel(selected.id)}`
                : "Continue to payment"}
          </Button>
        </>
      }
    >
      <div className="min-w-0 space-y-5">
        <div
          className="grid grid-cols-4 gap-2"
          role="group"
          aria-label="Quick amounts"
        >
          {PRESET_AMOUNTS.map((amt) => (
            <Button
              key={amt}
              type="button"
              variant={amount === amt.toString() ? "default" : "outline"}
              aria-pressed={amount === amt.toString()}
              className="px-0 tabular-nums"
              onClick={() => setAmount(amt.toString())}
            >
              ৳{amt}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor={amountId} className="text-sm font-medium">
            Amount (৳)
          </label>
          <Input
            id={amountId}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            placeholder="e.g. 1500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatBDT(toMinor(min))} to {formatBDT(toMinor(max))}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Pay with</p>

          {methodsState.status === "loading" && (
            <div className="grid gap-2" aria-busy="true">
              <Skeleton className="h-[66px] w-full rounded-lg" />
              <Skeleton className="h-[66px] w-full rounded-lg" />
            </div>
          )}

          {methodsState.status === "unavailable" && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Online top-up is unavailable right now. Please try again later.
            </p>
          )}

          {methodsState.status === "ready" && (
            <>
              <PaymentMethodPicker
                methods={methodsState.methods}
                value={method}
                onChange={setMethod}
                disabled={isPending}
              />

              {selected?.id === "BKASH" && (
                <p className="text-xs text-muted-foreground">
                  You&apos;ll go to bKash to approve {amountLabel || "the amount"}.
                  Your wallet is credited as soon as bKash confirms.
                </p>
              )}
              {selected?.id === "SSLCOMMERZ" && (
                <p className="text-xs text-muted-foreground">
                  You&apos;ll go to SSLCommerz to pay by card, Nagad, Rocket and more.
                </p>
              )}

              {selected?.testMode && (
                <p className="text-[11px] leading-snug text-muted-foreground/80">
                  {selected.id === "BKASH"
                    ? "Test mode: no real money moves. Use test wallet 01770618575, OTP 123456, PIN 12121."
                    : "Test mode: use SSLCommerz test cards."}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
