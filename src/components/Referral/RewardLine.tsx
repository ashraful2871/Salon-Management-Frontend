"use client";

import { useState } from "react";
import { Check, Gift, Info, Loader2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { formatBDT } from "@/lib/money";
import { shortDate } from "@/lib/referral-view";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { PromoQuote } from "@/services/referral/types";

/**
 * The one way a referral reward is shown next to a price:
 * `Gift  Referral reward (5%)  −৳50`, in the success tone. Every figure comes
 * from the API (`promoDiscountMinor`, the quote's `promo`), never from
 * `lib/referral.ts`.
 */

/** "−৳50" with a real minus sign. */
export const minusBDT = (minor: number) => `−${formatBDT(minor)}`;

const PAID_BY_HINT = (minor: number) =>
  `You receive this ${formatBDT(minor)} in your balance with the next payout. Collect only the amount below.`;

/**
 * A static reward row. `paidBy` is for the salon side only (owner, staff,
 * expert): "(paid by <site>)" plus a tap-to-read hint. Customers never see it.
 */
export function PromoLine({
  label,
  discountMinor,
  paidBy = false,
  hint,
  className,
  size = "sm",
}: {
  label?: string | null;
  discountMinor: number;
  paidBy?: boolean;
  /** Small line under the label ("Expires 12 Dec"). */
  hint?: string;
  className?: string;
  size?: "xs" | "sm";
}) {
  if (!(discountMinor > 0)) return null;
  const text = label || "Referral reward";
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 text-success",
        size === "xs" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <span className="flex min-w-0 items-start gap-1.5">
        <Gift aria-hidden className={cn("mt-0.5 shrink-0", size === "xs" ? "size-3.5" : "size-4")} />
        <span className="min-w-0 break-words">
          {text}
          {paidBy && <> (paid by {SITE.name})</>}
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
        {paidBy && <PaidByHint discountMinor={discountMinor} />}
      </span>
      <span className="shrink-0 font-semibold tabular-nums">{minusBDT(discountMinor)}</span>
    </div>
  );
}

/** The info button next to "(paid by …)": a popover, so it also works on a tap. */
export function PaidByHint({ discountMinor }: { discountMinor: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="-m-3.5 inline-grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
          aria-label="Who pays the referral reward"
        >
          <Info aria-hidden className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm" align="start">
        {PAID_BY_HINT(discountMinor)}
      </PopoverContent>
    </Popover>
  );
}

/** A small chip for list rows: "Reward −৳50" (salon side, before checkout). */
export function PromoChip({ discountMinor, className }: { discountMinor?: number | null; className?: string }) {
  if (!discountMinor || discountMinor <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success",
        className,
      )}
      title={`Referral reward, paid by ${SITE.name}`}
    >
      <Gift aria-hidden className="size-3" />
      Reward <span className="tabular-nums">{minusBDT(discountMinor)}</span>
    </span>
  );
}

/**
 * Before the review page: "5% reward applied at checkout". Not an amount, the
 * server picks the reward and works out the discount at review.
 */
export function RewardTeaser({ percent, className }: { percent?: number | null; className?: string }) {
  if (!percent || percent <= 0) return null;
  return (
    <p className={cn("flex items-center gap-1.5 text-xs font-medium text-success", className)}>
      <Gift aria-hidden className="size-3.5 shrink-0" />
      <span>{percent}% reward applied at checkout</span>
    </p>
  );
}

/**
 * The review-page row: the applied reward with a "Use it on this booking"
 * switch, and a "Change" picker when more than one reward fits. The parent
 * re-quotes on every change (`onChoose`): `undefined` = the best one, `null` =
 * none, an id = that one. `pending` greys the row only.
 */
export function RewardLine({
  promo,
  options,
  pending = false,
  onChoose,
}: {
  promo: PromoQuote | null;
  options: PromoQuote[];
  pending?: boolean;
  onChoose: (rewardId: string | null | undefined) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const shown = promo ?? options[0] ?? null;
  if (!shown) return null;
  const on = Boolean(promo);
  const switchId = `reward-switch-${shown.rewardId}`;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-opacity",
        on ? "border-success/20 bg-success-soft" : "border-border bg-surface-subtle",
        pending && "opacity-70",
      )}
      aria-busy={pending || undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex min-w-0 items-start gap-2", on ? "text-success" : "text-muted-foreground")}>
          {pending ? (
            <Loader2 aria-hidden className="mt-0.5 size-4 shrink-0 animate-spin" />
          ) : (
            <Gift aria-hidden className="mt-0.5 size-4 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold break-words">{shown.label}</p>
            <p className="text-xs text-muted-foreground">Expires {shortDate(shown.expiresAt)}</p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 text-sm font-semibold tabular-nums",
            on ? "text-success" : "text-muted-foreground line-through",
          )}
        >
          {minusBDT(shown.discountMinor)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label htmlFor={switchId} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <Switch
            id={switchId}
            checked={on}
            disabled={pending}
            onCheckedChange={(next) => onChoose(next ? shown.rewardId : null)}
          />
          Use it on this booking
        </label>
        {options.length > 1 && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={pending}
                className="min-h-11 rounded-full px-2 text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
              >
                Change
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] p-1.5">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Pick a reward</p>
              <ul role="listbox" aria-label="Your rewards">
                {options.map((o) => {
                  const selected = on && o.rewardId === promo?.rewardId;
                  return (
                    <li key={o.rewardId}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setPickerOpen(false);
                          if (!selected) onChoose(o.rewardId);
                        }}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none hover:bg-surface-subtle focus-visible:ring-[3px] focus-visible:ring-ring",
                          selected && "bg-success-soft",
                        )}
                      >
                        <Check
                          aria-hidden
                          className={cn("mt-0.5 size-4 shrink-0 text-success", !selected && "invisible")}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium break-words">{o.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {o.percent}% off · Expires {shortDate(o.expiresAt)}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold text-success tabular-nums">
                          {minusBDT(o.discountMinor)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

/** The REWARD_* codes the booking calls answer with. */
export const isRewardError = (code?: string) =>
  code === "REWARD_UNAVAILABLE" || code === "REWARD_NOT_APPLICABLE";
