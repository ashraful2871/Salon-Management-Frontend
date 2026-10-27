"use client";

import React, { useEffect, useId, useState, useTransition } from "react";
import { FlaskConical, Lock } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  defaultAmount,
  returnTo,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  /** Preselects this method if it is switched on ("Try another method"). */
  initialMethod?: ProviderId;
  /** Taka to start from on each open, e.g. what a booking is short by. */
  defaultAmount?: number;
  /** The booking review page this was opened from; the result page leads back. */
  returnTo?: string;
}) {
  const [amount, setAmount] = useState<string>(
    defaultAmount ? String(defaultAmount) : "500"
  );
  // Each open starts from the caller's amount again (it can change while the
  // dialog is closed, e.g. switching between deposit and paying in full).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && defaultAmount) setAmount(String(defaultAmount));
  }
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
      const res = await initiateTopup(val, provider, returnTo);
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
      description={
        returnTo
          ? "Once it's paid, you come straight back here to confirm your booking."
          : "Book instantly from your balance, with no gateway on the way."
      }
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
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={amountId} className="text-sm font-semibold text-charcoal">
              Amount
            </label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatBDT(toMinor(min))} – {formatBDT(toMinor(max))}
            </span>
          </div>

          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-xl font-semibold text-muted-foreground"
              aria-hidden
            >
              ৳
            </span>
            <Input
              id={amountId}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 rounded-xl pl-10 text-2xl font-semibold tabular-nums [appearance:textfield] md:text-2xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
            {PRESET_AMOUNTS.map((amt) => {
              const active = amount === amt.toString();
              return (
                <button
                  key={amt}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAmount(amt.toString())}
                  className={cn(
                    "h-8 rounded-full border px-3.5 text-[13px] font-medium tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                  )}
                >
                  {formatBDT(toMinor(amt))}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-charcoal">Payment method</p>

          {methodsState.status === "loading" && (
            <div className="grid grid-cols-2 gap-3" aria-busy="true">
              <Skeleton className="h-[72px] w-full rounded-xl" />
              <Skeleton className="h-[72px] w-full rounded-xl" />
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

              {selected?.testMode && (
                <div className="flex gap-2.5 rounded-xl border border-warning/25 bg-warning-soft/70 px-3 py-2.5 text-xs leading-relaxed text-warning">
                  <FlaskConical className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  <p>
                    <span className="font-semibold">Test mode</span> · no real money moves.{" "}
                    {selected.id === "BKASH"
                      ? "Wallet 01770618575, OTP 123456, PIN 12121."
                      : "Use SSLCommerz test cards."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" aria-hidden />
          Secure checkout · we never see your PIN or card number
        </p>
      </div>
    </ResponsiveDialog>
  );
}
