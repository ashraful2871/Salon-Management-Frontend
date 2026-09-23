"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Scissors,
  Timer,
  Wallet,
} from "lucide-react";

import { formatBDT } from "@/lib/money";
import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import { formatDhakaClock, formatDuration, formatTime, formatYmd } from "../format";
import { useAssistantLauncher } from "../AssistantContext";
import type { BlockProps } from "../block-props";

type BookingSummaryBlock = Extract<Block, { type: "booking_summary" }>;

const Row = ({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) => (
  <li className="flex items-start gap-2.5 text-sm">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    <span className="min-w-0 text-foreground">{children}</span>
  </li>
);

/**
 * "9:32" while the hold lasts, null once it has run out.
 *
 * A ticking clock rather than a counter the effect writes down: the remaining
 * time is derived, so there is no state to keep in step with the prop, and the
 * interval stops itself the moment it reaches zero.
 */
const useHoldCountdown = (holdExpiresAt?: string): string | null => {
  const expiresAt = holdExpiresAt ? Date.parse(holdExpiresAt) : NaN;
  const [now, setNow] = useState(() => Date.now());

  const running = !Number.isNaN(expiresAt) && expiresAt > now;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [running]);

  if (!running) return null;

  const seconds = Math.floor((expiresAt - now) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/**
 * The in-chat review card. A guest sees the Phase 2 card: nothing is held, so
 * the primary action hands off to the existing review page, pre-filled. A
 * signed-in customer whose slot the server has held gets the Confirm button
 * and a live countdown on the hold; at zero the button becomes "Get new
 * times", because confirming against a lapsed quote would only 410.
 */
const ChatBookingSummary = ({
  block,
  disabled,
  onAction,
  onConfirm,
  confirming = false,
  confirmed = false,
}: BlockProps<BookingSummaryBlock> & {
  onConfirm?: (token: string) => void;
  /** A confirm is in flight for this card. */
  confirming?: boolean;
  /** This card already produced a booking; its button never fires again. */
  confirmed?: boolean;
}) => {
  const { close } = useAssistantLauncher();
  const shortfall = block.wallet?.shortfallMinor ?? 0;
  const countdown = useHoldCountdown(block.holdExpiresAt);
  const token = block.confirmToken;

  const confirmInChat =
    block.canConfirmInChat && Boolean(onConfirm) && Boolean(token);
  // The hold is gone, so the quote behind the token is too. Sending it would
  // buy a 410; asking for new times is the same tap with a useful answer.
  const expired = confirmInChat && Boolean(block.holdExpiresAt) && !countdown;
  const blockedByWallet = shortfall > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-primary/30 bg-background">
      <div className="border-b border-border bg-primary/5 px-3.5 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Your appointment
        </p>
      </div>

      <div className="space-y-3 p-3.5">
        <ul className="space-y-2">
          <Row icon={MapPin}>
            <span className="font-semibold">{block.salon.name}</span>
            <span className="block text-xs text-muted-foreground">
              {block.salon.address || block.salon.area}
            </span>
          </Row>
          <Row icon={Scissors}>
            <span className="font-semibold">{block.service.name}</span>
            <span className="block text-xs text-muted-foreground">
              {formatDuration(block.service.duration)} · {block.counter.name}
              {block.counter.code ? ` ${block.counter.code}` : ""}
              {block.staff ? ` · ${block.staff.name}` : ""}
            </span>
          </Row>
          <Row icon={CalendarDays}>
            <span className="font-semibold">{formatYmd(block.slot.date)}</span>
            <span className="block text-xs text-muted-foreground">
              {formatTime(block.slot.startTime)}
              {block.slot.endTime ? ` – ${formatTime(block.slot.endTime)}` : ""}
            </span>
          </Row>
        </ul>

        <dl className="space-y-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-bold text-foreground">
              {formatBDT(block.priceMinor)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              Deposit held from wallet
            </dt>
            <dd className="font-medium text-foreground">
              {formatBDT(block.depositMinor)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pay at the salon</dt>
            <dd className="font-medium text-foreground">
              {formatBDT(block.dueAtSalonMinor)}
            </dd>
          </div>
          {shortfall > 0 && (
            <div className="flex justify-between gap-3 border-t border-border pt-1.5">
              <dt className="font-medium text-foreground">
                Top up your wallet by
              </dt>
              <dd className="font-bold text-foreground">
                {formatBDT(shortfall)}
              </dd>
            </div>
          )}
        </dl>

        {block.freeCancellationUntil && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Free cancellation until{" "}
            {formatDhakaClock(block.freeCancellationUntil)}
          </p>
        )}

        {confirmInChat && !confirmed && (
          <p
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            aria-live="off"
          >
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {countdown
              ? `Time held for ${countdown}`
              : "Your hold on this time has run out."}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {confirmed ? (
            <Chip
              label="Booked"
              style="primary"
              disabled
              onClick={() => {}}
              className="flex-1"
            />
          ) : expired ? (
            <Chip
              label="Get new times"
              style="primary"
              disabled={disabled}
              onClick={() =>
                onAction({ type: "change", target: "slot" }, "Get new times")
              }
              className="flex-1"
            />
          ) : confirmInChat ? (
            <Chip
              label={
                confirming
                  ? "Booking…"
                  : blockedByWallet
                    ? "Top up to confirm"
                    : "Confirm booking"
              }
              style="primary"
              // Never let a second confirm leave the browser: the button is
              // dead while one is in flight, and an empty wallet cannot pay the
              // deposit, so it is dead then too.
              disabled={disabled || confirming || blockedByWallet}
              onClick={() => token && onConfirm?.(token)}
              className="flex-1"
            />
          ) : (
            <Link
              href={block.handoffUrl}
              onClick={close}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Continue to book
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}

          {/* Phase 5 tops up inside the chat; until then the page that
              already works is one tap away, and the hold survives the trip. */}
          {blockedByWallet && confirmInChat && !confirmed && (
            <Link
              href="/dashboard/wallet"
              onClick={close}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Wallet className="h-4 w-4 shrink-0" aria-hidden />
              Top up {formatBDT(shortfall)}
            </Link>
          )}

          {!confirmed && (
            <Chip
              label="Change time"
              disabled={disabled || confirming}
              onClick={() =>
                onAction({ type: "change", target: "slot" }, "Change time")
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBookingSummary;
