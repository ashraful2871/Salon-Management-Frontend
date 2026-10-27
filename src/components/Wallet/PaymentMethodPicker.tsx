"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/payment-providers";
import type { PaymentMethodOption } from "@/services/payments/getPaymentMethods";

/**
 * The gateways' own artwork, trimmed to the mark (`public/payments/`, cut from
 * the full-size files in `public/`). The heights are optical, not equal: the
 * squarish bKash mark and the wide SSLCommerz wordmark read the same size at
 * these. Display only: which gateways are on comes from `GET /payments/methods`.
 */
const GATEWAYS: Record<
  ProviderId,
  { logo: string; width: number; height: number; size: string; compactSize: string }
> = {
  BKASH: {
    logo: "/payments/bkash.png",
    width: 350,
    height: 160,
    size: "h-10",
    compactSize: "h-7",
  },
  SSLCOMMERZ: {
    logo: "/payments/sslcommerz.png",
    width: 448,
    height: 86,
    size: "h-6",
    compactSize: "h-[18px]",
  },
};

/**
 * A radio group of the gateways that are switched on, one logo tile each; the
 * gateway's name is the tile's accessible name. Arrow keys move the selection
 * like native radios do; only the selected tile is a tab stop.
 *
 * `compact` is the chat's version: shorter tiles for the narrow panel.
 * Test mode is not marked here; each caller says it once under the picker.
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
      className="grid grid-cols-2 gap-3"
      onKeyDown={handleKeyDown}
    >
      {enabled.map((m, i) => {
        const selected = m.id === value;
        const gateway = GATEWAYS[m.id];
        return (
          <button
            key={m.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={m.name}
            title={m.name}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "relative flex w-full min-w-0 cursor-pointer items-center justify-center rounded-xl border bg-surface transition-[border-color,box-shadow,background-color] duration-150",
              compact ? "h-14 px-3" : "h-[72px] px-4",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-primary shadow-[0_0_0_1px_var(--primary),0_4px_14px_-6px_rgb(0_0_0/0.18)]"
                : "border-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-foreground/25 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.10)]"
            )}
          >
            {gateway ? (
              <Image
                src={gateway.logo}
                alt=""
                width={gateway.width}
                height={gateway.height}
                sizes="140px"
                className={cn(
                  "w-auto max-w-[85%] object-contain transition-opacity",
                  compact ? gateway.compactSize : gateway.size,
                  !selected && value !== null && "opacity-80"
                )}
              />
            ) : (
              <span className="text-sm font-semibold">{m.name}</span>
            )}

            {selected && (
              <span
                className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-hidden
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
