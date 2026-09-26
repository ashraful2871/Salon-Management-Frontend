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
const BkashMark = ({ compact }: { compact?: boolean }) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center rounded-md font-bold tracking-tight text-white",
      compact ? "h-8 w-11 text-[11px]" : "h-10 w-14 text-sm",
    )}
    style={{ backgroundColor: BKASH_PINK }}
    aria-hidden
  >
    bKash
  </span>
);

const CardMark = ({ compact }: { compact?: boolean }) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center rounded-md bg-muted text-charcoal",
      compact ? "h-8 w-11" : "h-10 w-14",
    )}
    aria-hidden
  >
    <CreditCard className={compact ? "h-4 w-4" : "h-5 w-5"} />
  </span>
);

/**
 * A radio group of the gateways that are switched on. Arrow keys move the
 * selection like native radios do; only the selected card is a tab stop.
 *
 * `compact` is the chat's version: tighter cards, no description line, so two
 * methods fit the narrow panel without pushing the pay button off screen.
 */
export default function PaymentMethodPicker({
  methods,
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  methods: PaymentMethodOption[];
  value: ProviderId | null;
  onChange: (id: ProviderId) => void;
  disabled?: boolean;
  compact?: boolean;
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
              "flex w-full min-w-0 cursor-pointer items-center rounded-lg border bg-background text-left transition-colors",
              compact ? "gap-2.5 p-2" : "gap-3 p-3",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-sage ring-2 ring-sage"
                : "hover:border-sage/50 hover:bg-muted/40"
            )}
          >
            {m.id === "BKASH" ? (
              <BkashMark compact={compact} />
            ) : (
              <CardMark compact={compact} />
            )}

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span
                  className={cn("font-medium", compact && "text-sm leading-tight")}
                >
                  {m.name}
                </span>
                {m.testMode && (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] tracking-wide"
                  >
                    SANDBOX
                  </Badge>
                )}
              </span>
              {!compact && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {m.description}
                </span>
              )}
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
