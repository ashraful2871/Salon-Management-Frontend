"use client";

import { AlertTriangle, Check, House, Loader2, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import { advanceOf } from "@/lib/home-policy";
import type {
  HomeAudience,
  HomeSalonMenu,
  HomeSalonMenuExpert,
} from "@/services/home-service/types";

/** The most services one home visit can carry (the API caps the cart at 10). */
export const HOME_CART_MAX = 10;

/** What the chosen cart costs, as the quote will price it (preview only). */
export const homeCartPrice = (menu: HomeSalonMenu | null, items: string[]) => {
  const chosen = (menu?.menu ?? []).filter((m) => items.includes(m.id));
  const subtotalMinor = chosen.reduce((s, m) => s + m.priceMinor, 0);
  const travelFeeMinor = chosen.length ? (menu?.salon.travelFeeMinor ?? 0) : 0;
  const totalMinor = subtotalMinor + travelFeeMinor;
  const advancePercent = menu?.advancePercent ?? 50;
  const advanceMinor = chosen.length ? advanceOf(totalMinor, advancePercent) : 0;
  const belowMinMinor = chosen.length
    ? Math.max(0, (menu?.salon.minOrderMinor ?? 0) - subtotalMinor)
    : 0;
  return {
    chosen,
    subtotalMinor,
    travelFeeMinor,
    totalMinor,
    advancePercent,
    advanceMinor,
    balanceMinor: totalMinor - advanceMinor,
    belowMinMinor,
    minutes: chosen.reduce((s, m) => s + m.durationMin, 0),
  };
};

/**
 * The expert the booking flow starts on. With "any available expert" the flow
 * books whoever is free, but it still needs one expert who does every service
 * in the cart: the best rated such expert, or null when nobody does them all.
 */
export const anchorExpertFor = (
  menu: HomeSalonMenu | null,
  items: string[],
): HomeSalonMenuExpert | null =>
  (menu?.experts ?? []).find((e) => items.every((id) => e.offeringIds.includes(id))) ?? null;

const SIDE_LABEL: Record<HomeAudience, { title: string; hint: string }> = {
  LADIES: { title: "Ladies", hint: "Female, ID-verified experts" },
  GENTS: { title: "Gents", hint: "Verified experts" },
};

type Props = {
  sides: { ladies: boolean; gents: boolean };
  audience: HomeAudience;
  onAudience: (audience: HomeAudience) => void;
  menu: HomeSalonMenu | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  items: string[];
  onItems: (items: string[]) => void;
  /** Shown under the list (e.g. "nobody does all of these together"). */
  problem?: string | null;
};

/**
 * "At home" on the salon's booking dialog: pick who it is for (when the branch
 * serves both), then the services, with the advance worked out as you go.
 * Date, time, address and payment are the Home Service booking flow's steps.
 */
export default function HomeServicePicker({
  sides,
  audience,
  onAudience,
  menu,
  loading,
  error,
  onRetry,
  items,
  onItems,
  problem,
}: Props) {
  const both = sides.ladies && sides.gents;
  const price = homeCartPrice(menu, items);

  const toggle = (id: string) => {
    if (items.includes(id)) onItems(items.filter((x) => x !== id));
    else if (items.length < HOME_CART_MAX) onItems([...items, id]);
  };

  return (
    <div className="space-y-6">
      {both && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Who is it for?</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Who is it for">
            {(["LADIES", "GENTS"] as const).map((side) => {
              const on = audience === side;
              return (
                <button
                  key={side}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onAudience(side)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-primary bg-primary-soft ring-1 ring-primary"
                      : "border-border bg-surface hover:bg-surface-subtle",
                  )}
                >
                  <span className="block font-semibold">{SIDE_LABEL[side].title}</span>
                  <span className="block text-xs text-muted-foreground">{SIDE_LABEL[side].hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface-subtle p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Loading home services...
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-warning-soft p-4 text-sm text-warning">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 shrink-0" aria-hidden /> {error}
          </p>
          <button type="button" onClick={onRetry} className="mt-2 font-semibold underline underline-offset-4">
            Try again
          </button>
        </div>
      ) : menu ? (
        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
            <House className="size-4 text-primary" aria-hidden /> Services at home
            <span className="font-normal text-muted-foreground">(pick one or more)</span>
          </legend>
          <div className="space-y-2">
            {menu.menu.map((service) => {
              const on = items.includes(service.id);
              const full = !on && items.length >= HOME_CART_MAX;
              return (
                <label
                  key={service.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-colors",
                    on
                      ? "border-primary bg-primary-soft ring-1 ring-primary"
                      : "border-border bg-surface hover:bg-surface-subtle",
                    full && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={full}
                      onChange={() => toggle(service.id)}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <div className="min-w-0">
                      <div className="break-words font-medium">{service.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.durationMin} min
                        {service.kitNote ? ` · ${service.kitNote}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 font-semibold tabular-nums">{formatBDT(service.priceMinor)}</div>
                </label>
              );
            })}
          </div>
          {problem && <p className="mt-2 text-xs font-medium text-destructive">{problem}</p>}
        </fieldset>
      ) : null}

      {menu && price.chosen.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-surface-subtle p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">
              Services ({price.chosen.length}) · {price.minutes} min
            </span>
            <span className="font-medium tabular-nums">{formatBDT(price.subtotalMinor)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Travel fee</span>
            <span className="font-medium tabular-nums">
              {price.travelFeeMinor > 0 ? formatBDT(price.travelFeeMinor) : "Free"}
            </span>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <span className="font-semibold">Total</span>
            <span className="font-bold tabular-nums">{formatBDT(price.totalMinor)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <Wallet className="size-4" aria-hidden /> Advance now ({price.advancePercent}%)
            </span>
            <span className="font-bold tabular-nums text-primary">{formatBDT(price.advanceMinor)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Pay at home after the service</span>
            <span className="font-medium tabular-nums">{formatBDT(price.balanceMinor)}</span>
          </div>
          {price.belowMinMinor > 0 ? (
            <p className="flex items-start gap-1.5 pt-1 text-xs font-medium text-warning">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Add {formatBDT(price.belowMinMinor)} more: the minimum order is{" "}
              {formatBDT(menu.salon.minOrderMinor)}.
            </p>
          ) : (
            <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              Next you pick the date, time and address, then pay the advance to confirm.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
