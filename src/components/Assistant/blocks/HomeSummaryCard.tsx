"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, House, Scissors } from "lucide-react";

import { formatBDT } from "@/lib/money";
import type { HomeSummaryBlock } from "@/lib/assistant-types";
import { useAssistantLauncher } from "../AssistantContext";
import { formatDuration } from "../format";

const Row = ({ icon: Icon, children }: { icon: typeof House; children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
    <span className="min-w-0 text-sm">{children}</span>
  </li>
);

/**
 * The home visit as it will be quoted. The address, the cancellation
 * disclaimer and paying the advance happen on the booking page, which the
 * button opens at the address step with the cart, day and time filled in.
 */
const HomeSummaryCard = ({ block }: { block: HomeSummaryBlock }) => {
  const { close } = useAssistantLauncher();
  const handoff = block.handoffUrl?.startsWith("/") ? block.handoffUrl : "/home-service";
  const href = block.signedIn ? handoff : `/login?redirect=${encodeURIComponent(handoff)}`;
  const minutes = block.services.reduce((sum, s) => sum + s.durationMin, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-primary/30 bg-surface">
      <div className="border-b border-border bg-primary/5 px-3.5 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Your home visit · {block.audience === "LADIES" ? "Ladies" : "Gents"}
        </p>
      </div>

      <div className="space-y-3 p-3.5">
        <ul className="space-y-2">
          <Row icon={House}>
            <span className="font-semibold">{block.salon.name}</span>
            <span className="block text-xs text-muted-foreground">
              {block.salon.area} · any available expert
            </span>
          </Row>
          <Row icon={Scissors}>
            <span className="font-semibold">{block.services.map((s) => s.name).join(", ")}</span>
            <span className="block text-xs text-muted-foreground">{formatDuration(minutes)}</span>
          </Row>
          <Row icon={CalendarDays}>
            <span className="font-semibold">{block.dateLabel}</span>
            <span className="block text-xs text-muted-foreground">Expert arrives at {block.timeLabel}</span>
          </Row>
        </ul>

        <dl className="space-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Services</dt>
            <dd className="font-medium text-foreground">{formatBDT(block.subtotalMinor)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Travel fee</dt>
            <dd className="font-medium text-foreground">
              {block.travelFeeMinor > 0 ? formatBDT(block.travelFeeMinor) : "Free"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-1.5">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{formatBDT(block.totalMinor)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-primary">Advance now ({block.advancePercent}%)</dt>
            <dd className="font-bold text-primary">{formatBDT(block.advanceMinor)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pay at home after the service</dt>
            <dd className="font-medium text-foreground">{formatBDT(block.balanceMinor)}</dd>
          </div>
        </dl>

        <Link
          href={href}
          onClick={close}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {block.signedIn ? "Add address & pay advance" : "Sign in to continue"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="text-xs text-muted-foreground">
          The booking is confirmed once the {formatBDT(block.advanceMinor)} advance is paid. You will see the
          cancellation policy before you pay.
        </p>
      </div>
    </div>
  );
};

export default HomeSummaryCard;
