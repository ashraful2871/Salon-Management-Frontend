"use client";

import { Lock, Wallet } from "lucide-react";

import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Block } from "@/lib/assistant-types";

type WalletStatusBlock = Extract<Block, { type: "wallet_status" }>;

/**
 * Only ever built from the `*Minor` fields: `formatBDT` divides by 100, so the
 * taka twin `addTakaFields` adds would render a hundredth of the real figure.
 */
const WalletStatus = ({ block }: { block: WalletStatusBlock }) => {
  const short = block.shortfallMinor > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5",
        short ? "border-gold/40 bg-gold/5" : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-gold" aria-hidden />
          Wallet
        </span>
        <span className="text-base font-bold text-foreground">
          {formatBDT(block.availableMinor)}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {block.heldMinor > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Held for other bookings</dt>
            <dd className="font-medium text-foreground">
              {formatBDT(block.heldMinor)}
            </dd>
          </div>
        )}
        {block.depositFromMinor > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Deposit for this salon</dt>
            <dd className="font-medium text-foreground">
              {formatBDT(block.depositFromMinor)}
            </dd>
          </div>
        )}
        {short && (
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-foreground">Still needed</dt>
            <dd className="font-bold text-foreground">
              {formatBDT(block.shortfallMinor)}
            </dd>
          </div>
        )}
      </dl>

      {block.isFrozen && (
        <p className="mt-3 flex items-start gap-2 text-xs text-destructive">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Your wallet is frozen, so a deposit cannot be held right now.
        </p>
      )}

      {block.note && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {block.note}
        </p>
      )}
    </div>
  );
};

export default WalletStatus;
