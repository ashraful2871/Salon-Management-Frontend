"use client";

import { Phone } from "lucide-react";

import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import { formatTime, formatYmd } from "../format";
import type { BlockProps } from "../block-props";

type CancellationPreviewBlock = Extract<Block, { type: "cancellation_preview" }>;

/**
 * What cancelling costs, shown before anything is cancelled. The figures come
 * from the same quote the cancel applies; this card only formats them. The
 * "Yes, cancel it" chip is the second tap — the first one only drew this.
 */
const CancellationPreview = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<CancellationPreviewBlock>) => {
  const late = block.penaltyMinor > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5",
        !block.cancellable
          ? "border-destructive/30 bg-destructive/5"
          : late
            ? "border-gold/40 bg-gold/5"
            : "border-border bg-muted/40",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Cancel booking
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {block.serviceName} · {block.salonName}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatYmd(block.date)} · {formatTime(block.startTime)}
      </p>

      {block.cancellable ? (
        <>
          <p className="mt-3 text-sm text-foreground">
            {block.depositMinor <= 0
              ? "No deposit is held for this booking."
              : late
                ? `Cancelling now keeps ${formatBDT(block.penaltyMinor)} (${block.penaltyPercent} %) of your ${formatBDT(block.depositMinor)} deposit; ${formatBDT(block.refundMinor)} returns to your wallet.`
                : `Cancelling now is free — your ${formatBDT(block.depositMinor)} deposit goes straight back.`}
          </p>
          {block.depositMinor > 0 && (
            <dl className="mt-2 space-y-1 rounded-lg bg-background/70 px-3 py-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deposit</dt>
                <dd className="font-medium">{formatBDT(block.depositMinor)}</dd>
              </div>
              {late && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Late-cancellation fee</dt>
                  <dd className="font-medium">− {formatBDT(block.penaltyMinor)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-border pt-1">
                <dt className="font-medium text-foreground">Back to your wallet</dt>
                <dd className="font-bold">{formatBDT(block.refundMinor)}</dd>
              </div>
            </dl>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-foreground">
          This appointment has already started. Please call the salon.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!block.cancellable && block.salonPhone && (
          <a
            href={`tel:${block.salonPhone}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {block.salonPhone}
          </a>
        )}
        {block.actions?.map((option, i) => (
          <Chip
            key={`${option.label}-${i}`}
            label={option.label}
            icon={option.icon}
            style={option.style}
            selected={chosen === option.label}
            disabled={disabled}
            onClick={() => onAction(option.action, option.label)}
          />
        ))}
      </div>
    </div>
  );
};

export default CancellationPreview;
