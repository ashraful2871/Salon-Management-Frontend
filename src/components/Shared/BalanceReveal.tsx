"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, Wallet as WalletIcon } from "lucide-react";

import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

type Figure = { label: string; amountMinor: number | null };

type BalanceRevealProps = {
  /** `pill` sits in the desktop header; `card` is the block in the mobile drawer. */
  variant: "pill" | "card";
  /** "Available balance", "Owner revenue", "Platform revenue". */
  label: string;
  /** [0] is the headline; the rest show under it on the card. */
  figures: Figure[];
  /** Called on each reveal, e.g. to re-read a stale balance. */
  onReveal?: () => void;
  refreshing?: boolean;
  /** Card only: top-right of the card, beside the label (e.g. a refresh button). */
  action?: ReactNode;
  /** Card only: rendered as-is under the figures, so it owns its padding. */
  footer?: ReactNode;
  className?: string;
};

const MASK = "৳ ••••";

/**
 * One amount, masked until revealed. The value is not in the DOM while masked,
 * so a screen reader hears "hidden" and nothing can be read off the page; the
 * two states share one grid cell and crossfade without moving.
 */
const Amount = ({
  amountMinor,
  revealed,
}: {
  amountMinor: number | null;
  revealed: boolean;
}) => (
  <span className="inline-grid min-w-0">
    <span
      aria-hidden
      className={cn(
        "col-start-1 row-start-1 transition-opacity duration-200",
        revealed && "opacity-0",
      )}
    >
      {MASK}
    </span>
    <span
      className={cn(
        "col-start-1 row-start-1 truncate transition-opacity duration-200",
        !revealed && "opacity-0",
      )}
    >
      {revealed ? (amountMinor === null ? "--" : formatBDT(amountMinor)) : null}
    </span>
    {!revealed && <span className="sr-only">hidden</span>}
  </span>
);

/**
 * "Tap for balance": a real toggle button. It stays revealed until tapped
 * again (or unmounted) - no timer - and every figure is masked until then.
 */
const BalanceReveal = ({
  variant,
  label,
  figures,
  onReveal,
  refreshing = false,
  action,
  footer,
  className,
}: BalanceRevealProps) => {
  const [revealed, setRevealed] = useState(false);
  const [headline, ...rest] = figures;

  const toggle = () => {
    if (!revealed) onReveal?.();
    setRevealed(!revealed);
  };

  if (!headline) return null;

  if (variant === "pill") {
    return (
      <button
        type="button"
        aria-pressed={revealed}
        onClick={toggle}
        title={revealed ? "Tap to hide" : "Tap to show"}
        className={cn(
          "flex h-10 w-36 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-white pl-1 pr-3 transition-shadow duration-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
      >
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-dark text-white"
        >
          <WalletIcon className="h-4 w-4" />
        </span>
        <span
          aria-live="polite"
          aria-busy={refreshing}
          className="flex min-w-0 flex-1 items-center justify-center gap-1 text-sm font-semibold tabular-nums text-charcoal"
        >
          <span className="sr-only">{label}: </span>
          <Amount amountMinor={headline.amountMinor} revealed={revealed} />
          {refreshing && (
            <Loader2
              aria-hidden
              className="h-3 w-3 shrink-0 animate-spin text-muted-foreground"
            />
          )}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-cream to-white",
        className,
      )}
    >
      <div className="px-4 pt-3 pb-1">
        <div className="flex min-h-7 items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <WalletIcon aria-hidden className="h-3.5 w-3.5" /> {label}
          </p>
          {action}
        </div>

        <button
          type="button"
          aria-pressed={revealed}
          onClick={toggle}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span
            aria-live="polite"
            aria-busy={refreshing}
            className="flex min-w-0 items-center gap-2 text-2xl font-bold tabular-nums text-charcoal"
          >
            <span className="sr-only">{headline.label}: </span>
            <Amount amountMinor={headline.amountMinor} revealed={revealed} />
            {refreshing && (
              <Loader2
                aria-hidden
                className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
              />
            )}
          </span>
          <span
            aria-hidden
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {revealed ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {revealed ? "Tap to hide" : "Tap to show"}
          </span>
        </button>
      </div>

      {rest.length > 0 && (
        <dl
          aria-live="polite"
          className="grid grid-cols-2 divide-x divide-border border-y border-border"
        >
          {rest.map((figure) => (
            <div key={figure.label} className="px-4 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {figure.label}
              </dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-charcoal">
                <Amount amountMinor={figure.amountMinor} revealed={revealed} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {footer}
    </div>
  );
};

export default BalanceReveal;
