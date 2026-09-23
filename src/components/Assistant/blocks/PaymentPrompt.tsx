"use client";

import { useState } from "react";
import { ShieldCheck, Wallet } from "lucide-react";

import { formatBDT } from "@/lib/money";
import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";

type PaymentPromptBlock = Extract<Block, { type: "payment_prompt" }>;

export type StartTopup = (
  amountMinor: number,
  autoConfirm: boolean,
  label: string,
) => void;

/**
 * The top-up card. Every figure is a `*Minor` field through `formatBDT` — the
 * taka twins are never shown.
 *
 * "Top up & book" is one decision covering both steps, and the only thing that
 * lets the server finish the booking when the money lands; "Top up only" comes
 * back to the summary for a second tap. The amounts on offer all cover the
 * shortfall, so neither button can leave the booking still short.
 */
const PaymentPrompt = ({
  block,
  disabled,
  onTopup,
  toppingUp = false,
}: {
  block: PaymentPromptBlock;
  disabled: boolean;
  /** Absent outside the panel, which keeps a reused card inert. */
  onTopup?: StartTopup;
  toppingUp?: boolean;
}) => {
  const presets =
    Array.isArray(block.presets) && block.presets.length > 0
      ? block.presets
      : [block.suggestedTopupMinor];
  const [amountMinor, setAmountMinor] = useState(block.suggestedTopupMinor);

  const inert = disabled || toppingUp || !onTopup;
  const amount = formatBDT(amountMinor);
  const shortfall = block.shortfallMinor;
  const minimum = formatBDT(block.minTopupMinor);

  // A ৳30 gap still means a ৳100 top-up. Said plainly, so the figure on the
  // button does not read like a mistake.
  const lead =
    shortfall <= 0
      ? `Add money to your wallet. The smallest top-up is ${minimum}.`
      : shortfall < block.minTopupMinor
        ? `You need ${formatBDT(shortfall)} more. The smallest top-up is ${minimum} — the rest stays in your wallet for next time.`
        : `You need ${formatBDT(shortfall)} more for the deposit.`;

  const autoConfirm = block.canAutoConfirm;

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="h-4 w-4 shrink-0 text-gold" aria-hidden />
        Top up your wallet
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {lead}
      </p>

      {presets.length > 1 && (
        <div
          role="group"
          aria-label="Top-up amount"
          className="mt-3 flex flex-wrap gap-2"
        >
          {presets.map((preset) => (
            <Chip
              key={preset}
              label={formatBDT(preset)}
              selected={preset === amountMinor}
              disabled={inert}
              onClick={() => setAmountMinor(preset)}
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {autoConfirm ? (
          <>
            <Chip
              label={toppingUp ? "Opening…" : `Top up & book ${amount}`}
              icon="wallet"
              style="primary"
              disabled={inert}
              onClick={() =>
                onTopup?.(amountMinor, true, `Top up & book ${amount}`)
              }
              className="flex-1"
            />
            <Chip
              label="Top up only"
              disabled={inert}
              onClick={() => onTopup?.(amountMinor, false, `Top up ${amount}`)}
            />
          </>
        ) : (
          <Chip
            label={toppingUp ? "Opening…" : `Top up ${amount}`}
            icon="wallet"
            style="primary"
            disabled={inert}
            onClick={() => onTopup?.(amountMinor, false, `Top up ${amount}`)}
            className="flex-1"
          />
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {autoConfirm
          ? "You will pay on the bKash/Nagad/card page, then come back here and your booking finishes by itself."
          : "You will pay on the bKash/Nagad/card page, then come back here."}
      </p>

      {block.methods?.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {block.methods.map((method) => (
            <span
              key={method}
              className="rounded-full border border-border bg-background px-2 py-0.5"
            >
              {method}
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

export default PaymentPrompt;
