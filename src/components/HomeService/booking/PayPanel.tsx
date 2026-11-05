"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { BKASH_PINK, providerLabel, TOPUP_METHOD_KEY, type ProviderId } from "@/lib/payment-providers";
import { cn } from "@/lib/utils";
import type { PaymentMethodOption } from "@/services/payments/getPaymentMethods";
import { payHomeBooking } from "@/services/home-service/payHomeBooking";
import type { HomeAudience, HomeBooking } from "@/services/home-service/types";
import { homeErrorMessage } from "./errors";

export type HomePayOutcome =
  | { kind: "paid"; booking: HomeBooking }
  | { kind: "redirecting" }
  | { kind: "failed"; errorCode?: string };

/**
 * Pays a PENDING_PAYMENT visit's advance at bKash or SSLCommerz: the browser
 * leaves for the gateway and comes back to the visit's page. The wallet is
 * not a way to pay. `redirecting` stays set until the page has gone, for the
 * full-screen hand-off.
 */
export function useHomePay() {
  const [pending, setPending] = useState(false);
  const [redirecting, setRedirecting] = useState<ProviderId | null>(null);
  const pay = async (id: string, _audience: HomeAudience, method: ProviderId): Promise<HomePayOutcome> => {
    setPending(true);
    try {
      localStorage.setItem(TOPUP_METHOD_KEY, method);
    } catch {
      // Storage blocked: the method just isn't remembered.
    }
    const res = await payHomeBooking(id, method, crypto.randomUUID());
    if (!res.success || !res.data) {
      setPending(false);
      toast.error(homeErrorMessage(res));
      return { kind: "failed", errorCode: res.errorCode };
    }
    if (res.data.status === "PENDING_PAYMENT") {
      setRedirecting(method);
      window.location.assign(res.data.redirectUrl);
      return { kind: "redirecting" };
    }
    // Already paid (a second tab, a double tap): the visit's page shows it.
    setPending(false);
    return { kind: "paid", booking: res.data.booking };
  };
  return { pay, pending, redirecting };
}

/** What each gateway takes, in the customer's words. Which ones are on comes from `GET /payments/methods`. */
const METHOD_COPY: Record<ProviderId, { title: string; body: string; logo: string; w: number; h: number; logoClass: string; chips?: string[] }> = {
  BKASH: {
    title: "bKash",
    body: "Pay from your bKash account. You confirm with your PIN on bKash's own page.",
    logo: "/payments/bkash.png",
    w: 350,
    h: 160,
    logoClass: "h-7",
  },
  SSLCOMMERZ: {
    title: "Card or mobile banking",
    body: "Visa, Mastercard, Amex, Nagad, Rocket and net banking, through SSLCommerz.",
    logo: "/payments/sslcommerz.png",
    w: 448,
    h: 86,
    logoClass: "h-[14px]",
    chips: ["Visa", "Mastercard", "Amex", "Nagad", "Rocket"],
  },
};

const buttonLabel = (m: ProviderId | null) => (m === "SSLCOMMERZ" ? "card or mobile banking" : providerLabel(m));

/**
 * The checkout: one card per gateway (radio group, arrow keys move it), the
 * amount, one Pay button, and what happens next. Refunds go back to the same
 * account, so the panel says so.
 */
export function PayPanel({
  amountMinor,
  balanceMinor,
  methods,
  initialMethod,
  disabled,
  pending,
  onPay,
  hint,
  title = "Pay the advance",
}: {
  /** What the gateway is asked for: the whole advance. */
  amountMinor: number;
  /** Paid at the door after the service; shown so the customer knows. */
  balanceMinor?: number;
  methods: PaymentMethodOption[];
  initialMethod?: ProviderId | null;
  disabled?: boolean;
  pending: boolean;
  onPay: (method: ProviderId) => void;
  /** Under the button, e.g. why it is disabled. */
  hint?: string | null;
  title?: string;
}) {
  const enabled = methods.filter((m) => m.enabled);
  const [method, setMethod] = useState<ProviderId | null>(
    enabled.find((m) => m.id === initialMethod)?.id ?? enabled[0]?.id ?? null,
  );
  // The method used last time, unless the page asked for one.
  useEffect(() => {
    if (initialMethod) return;
    try {
      const last = localStorage.getItem(TOPUP_METHOD_KEY);
      const hit = enabled.find((m) => m.id === last);
      if (hit) setMethod(hit.id);
    } catch {
      // Storage blocked: keep the first one.
    }
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, enabled.findIndex((m) => m.id === method));
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step || pending || enabled.length === 0) return;
    e.preventDefault();
    const next = (selectedIndex + step + enabled.length) % enabled.length;
    setMethod(enabled[next].id);
    refs.current[next]?.focus();
  };

  const testMode = enabled.some((m) => m.testMode);
  const isBkash = method === "BKASH";

  return (
    <section aria-labelledby="home-pay-title" className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5 sm:px-5">
        <h3 id="home-pay-title" className="font-semibold text-foreground">
          {title}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
          <ShieldCheck className="size-4" aria-hidden /> Secure checkout
        </span>
      </header>

      {enabled.length === 0 ? (
        <p className="px-4 py-5 text-sm text-danger sm:px-5">
          Online payment is unavailable right now. Your time is still held. Please try again in a minute.
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-label="Payment method"
          aria-disabled={pending || undefined}
          className="space-y-2.5 p-4 sm:p-5"
          onKeyDown={onKeyDown}
        >
          {enabled.map((m, i) => {
            const copy = METHOD_COPY[m.id];
            const on = m.id === method;
            return (
              <button
                key={m.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={i === selectedIndex ? 0 : -1}
                disabled={pending}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-[border-color,background-color,box-shadow] sm:p-4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                  on ? "border-primary bg-primary-soft/60 shadow-[0_0_0_1px_var(--primary)]" : "border-border hover:border-foreground/25",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                  )}
                >
                  {on && <Check className="size-3" strokeWidth={3.5} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="font-semibold text-foreground">{copy?.title ?? m.name}</span>
                    {copy && (
                      <Image
                        src={copy.logo}
                        alt=""
                        width={copy.w}
                        height={copy.h}
                        sizes="120px"
                        className={cn("w-auto object-contain", copy.logoClass)}
                      />
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{copy?.body ?? m.description}</span>
                  {copy?.chips && (
                    <span className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
                      {copy.chips.map((c) => (
                        <span key={c} className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {c}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {testMode && <p className="text-xs text-muted-foreground">Test mode: no real money moves.</p>}
        </div>
      )}

      <footer className="space-y-3 border-t border-border bg-surface-subtle px-4 py-4 sm:px-5">
        <dl className="space-y-1 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="font-medium text-foreground">Pay now</dt>
            <dd className="font-display text-2xl font-bold text-foreground tabular-nums">{formatBDT(amountMinor)}</dd>
          </div>
          {balanceMinor !== undefined && balanceMinor > 0 && (
            <div className="flex justify-between gap-3 text-muted-foreground">
              <dt>Pay at home, after the service</dt>
              <dd className="tabular-nums">{formatBDT(balanceMinor)}</dd>
            </div>
          )}
        </dl>
        <Button
          className="h-12 w-full text-base"
          style={isBkash && !disabled && !pending ? { backgroundColor: BKASH_PINK, color: "#fff" } : undefined}
          disabled={disabled || pending || !method || enabled.length === 0}
          onClick={() => method && onPay(method)}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
          Pay {formatBDT(amountMinor)} with {buttonLabel(method)}
        </Button>
        {hint && <p className="text-center text-xs font-medium text-muted-foreground">{hint}</p>}
        <ul className="space-y-1.5 pt-1 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <Lock className="mt-px size-3.5 shrink-0" aria-hidden />
            You pay on {method ? providerLabel(method) : "the gateway"}&apos;s secure page. We never see your PIN or card number.
          </li>
          <li className="flex gap-2">
            <RotateCcw className="mt-px size-3.5 shrink-0" aria-hidden />
            Any refund goes back to the same bKash account or card, automatically.
          </li>
        </ul>
      </footer>
    </section>
  );
}

/**
 * Covers the page while the browser leaves for the gateway, so nothing else
 * can be tapped and the customer knows what is happening.
 */
export function GatewayRedirectOverlay({ provider }: { provider: ProviderId | null }) {
  if (!provider) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] grid place-items-center bg-background/90 px-6 backdrop-blur-sm"
    >
      <div className="max-w-sm space-y-4 text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">Taking you to {buttonLabel(provider)}…</p>
          <p className="text-sm text-muted-foreground">
            Finish paying there and you&apos;ll come straight back to your booking. Please don&apos;t close this tab.
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" aria-hidden /> Secure payment
        </p>
      </div>
    </div>
  );
}
