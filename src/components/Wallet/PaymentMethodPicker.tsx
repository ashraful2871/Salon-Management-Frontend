"use client";

import React, { useRef } from "react";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BKASH_PINK, type ProviderId } from "@/lib/payment-providers";
import type { PaymentMethodOption } from "@/services/payments/getPaymentMethods";

/**
 * Stand-in for the bKash logo. The official artwork, once we have it, goes at
 * `public/payments/bkash.svg` and replaces this tile.
 */
const BkashMark = () => (
  <span
    className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md text-sm font-bold tracking-tight text-white"
    style={{ backgroundColor: BKASH_PINK }}
    aria-hidden
  >
    bKash
  </span>
);

const CardMark = () => (
  <span
    className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-charcoal"
    aria-hidden
  >
    <CreditCard className="h-5 w-5" />
  </span>
);

/**
 * A radio group of the gateways that are switched on. Arrow keys move the
 * selection like native radios do; only the selected card is a tab stop.
 */
export default function PaymentMethodPicker({
  methods,
  value,
  onChange,
  disabled = false,
}: {
  methods: PaymentMethodOption[];
  value: ProviderId | null;
  onChange: (id: ProviderId) => void;
  disabled?: boolean;
}) {
  const enabled = methods.filter((m) => m.enabled);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = enabled.findIndex((m) => m.id === value);
  // With nothing selected the first card takes the tab stop, or the group
  // could not be reached from the keyboard at all.
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || enabled.length === 0) return;
    const step =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = (tabStop + step + enabled.length) % enabled.length;
    onChange(enabled[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Payment method"
      aria-disabled={disabled || undefined}
      className="grid gap-2"
      onKeyDown={handleKeyDown}
    >
      {enabled.map((m, i) => {
        const selected = m.id === value;
        return (
          <button
            key={m.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex w-full min-w-0 items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-sage ring-2 ring-sage"
                : "hover:border-sage/50 hover:bg-muted/40"
            )}
          >
            {m.id === "BKASH" ? <BkashMark /> : <CardMark />}

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{m.name}</span>
                {m.testMode && (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] tracking-wide"
                  >
                    SANDBOX
                  </Badge>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {m.description}
              </span>
            </span>

            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-sage" : "border-muted-foreground/40"
              )}
              aria-hidden
            >
              {selected && <span className="h-2 w-2 rounded-full bg-sage" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
