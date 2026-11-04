"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { advanceOf } from "@/lib/home-policy";
import type { HomeServicePickerBlock } from "@/lib/assistant-types";
import { formatDuration } from "../format";
import type { BlockProps } from "../block-props";

/** The API caps a home cart at 10 services. */
const MAX_ITEMS = 10;

/**
 * A salon's home menu in the chat. Unlike the salon funnel's one-tap service
 * rows, a home visit can carry several services, so these are toggles with a
 * running total, the advance and one Continue that sends them together.
 */
const HomeServicePicker = ({ block, disabled, onAction }: BlockProps<HomeServicePickerBlock>) => {
  const services = block.services ?? [];
  const [picked, setPicked] = useState<string[]>(() =>
    (block.selected ?? []).filter((id) => services.some((s) => s.id === id)),
  );
  if (services.length === 0) return null;

  const chosen = services.filter((s) => picked.includes(s.id));
  const subtotal = chosen.reduce((sum, s) => sum + s.priceMinor, 0);
  const total = chosen.length ? subtotal + block.travelFeeMinor : 0;
  const advance = chosen.length ? advanceOf(total, block.advancePercent) : 0;
  const short = chosen.length ? Math.max(0, block.minOrderMinor - subtotal) : 0;

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_ITEMS ? [...prev, id] : prev,
    );

  // The API keeps the label as the customer's message and caps it at 80.
  const label = (() => {
    const names = chosen.map((s) => s.name).join(", ");
    return names.length <= 80 ? names : `${chosen.length} services`;
  })();
  const send = () => onAction({ type: "home_services", offeringIds: picked }, label);

  return (
    <div className="space-y-2.5">
      <ul className="space-y-2" aria-label="Home services">
        {services.map((service) => {
          const on = picked.includes(service.id);
          return (
            <li key={service.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={disabled || (!on && picked.length >= MAX_ITEMS)}
                onClick={() => toggle(service.id)}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  on
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-surface hover:border-primary/50 hover:bg-primary/5",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{service.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDuration(service.durationMin)}
                      {service.kitNote ? ` · ${service.kitNote}` : ""}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-foreground">{formatBDT(service.priceMinor)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {chosen.length > 0 && (
        <dl className="space-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Services ({chosen.length})</dt>
            <dd className="font-medium text-foreground">{formatBDT(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Travel fee</dt>
            <dd className="font-medium text-foreground">
              {block.travelFeeMinor > 0 ? formatBDT(block.travelFeeMinor) : "Free"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-1.5">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{formatBDT(total)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-primary">Advance ({block.advancePercent}%)</dt>
            <dd className="font-bold text-primary">{formatBDT(advance)}</dd>
          </div>
        </dl>
      )}

      {short > 0 && (
        <p className="text-xs font-medium text-warning">
          Add {formatBDT(short)} more: the minimum home order is {formatBDT(block.minOrderMinor)}.
        </p>
      )}

      <button
        type="button"
        onClick={send}
        disabled={disabled || chosen.length === 0 || short > 0}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {chosen.length ? `Continue with ${chosen.length} service${chosen.length === 1 ? "" : "s"}` : "Pick a service"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
};

export default HomeServicePicker;
