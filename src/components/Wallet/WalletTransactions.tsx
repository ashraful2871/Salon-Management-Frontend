"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  LockOpen,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import CopyButton from "@/components/Wallet/CopyButton";
import { humanizeStatus } from "@/components/Shared/ToneBadge";
import { addDays, dhakaToday } from "@/components/Dashboard/appointments/format";
import type { WalletTransaction } from "@/services/wallet/getTransactions";
import { formatBDT } from "@/lib/money";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";

/*
 * Rendered on the server, so the first transactions are in the page's HTML.
 * Times are Dhaka's whatever the server's clock zone is.
 */

const DHAKA_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" });
const DHAKA_TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});
// Calendar days are read as UTC, like the appointment dates.
const DAY_PARTS = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// "Today", "Yesterday", "24 Sep", or "24 Sep 2025" outside this year.
const dayLabel = (ymd: string, today: string) => {
  if (ymd === today) return "Today";
  if (ymd === addDays(today, -1)) return "Yesterday";
  const parts = Object.fromEntries(
    DAY_PARTS.formatToParts(new Date(`${ymd}T00:00:00Z`)).map((p) => [
      p.type,
      p.value,
    ]),
  );
  const label = `${parts.day} ${parts.month}`;
  return ymd.slice(0, 4) === today.slice(0, 4) ? label : `${label} ${parts.year}`;
};

type Kind = "credit" | "debit" | "hold" | "release" | "refund";

const KIND: Record<Kind, { tone: Tone; icon: LucideIcon; label: string }> = {
  credit: { tone: "success", icon: ArrowDownLeft, label: "Money in" },
  debit: { tone: "neutral", icon: ArrowUpRight, label: "Money out" },
  hold: { tone: "warning", icon: Lock, label: "Held" },
  release: { tone: "warning", icon: LockOpen, label: "Released" },
  refund: { tone: "info", icon: RotateCcw, label: "Refund" },
};

const describe = (tx: WalletTransaction) => {
  const holdDeltaMinor =
    typeof tx.metadata?.holdDeltaMinor === "number"
      ? tx.metadata.holdDeltaMinor
      : null;
  // A hold or release shifts money between available and held without
  // changing the total, so its amountMinor is 0 and the hold delta is the only
  // figure worth showing.
  if (tx.amountMinor === 0 && holdDeltaMinor !== null) {
    return {
      kind: (holdDeltaMinor < 0 ? "release" : "hold") as Kind,
      amountMinor: Math.abs(holdDeltaMinor),
      sign: "",
    };
  }
  const kind: Kind =
    tx.type === "REFUND" ? "refund" : tx.amountMinor > 0 ? "credit" : "debit";
  return {
    kind,
    amountMinor: Math.abs(tx.amountMinor),
    // U+2212, so the minus is as wide as the plus in tabular figures.
    sign: tx.amountMinor > 0 ? "+" : tx.amountMinor < 0 ? "−" : "",
  };
};

// Gateway top-ups carry the id the customer also has on their receipt email
// and on the payment result page: the only handle support can trace. Rows from
// before that metadata still have it in their idempotency key.
const gatewayIdOf = (tx: WalletTransaction) =>
  typeof tx.metadata?.transactionId === "string"
    ? tx.metadata.transactionId
    : tx.idempotencyKey?.startsWith("topup:")
      ? tx.idempotencyKey.slice("topup:".length)
      : null;

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const { kind, amountMinor, sign } = describe(tx);
  const { tone, icon: Icon, label } = KIND[kind];
  const gatewayId = gatewayIdOf(tx);
  const gatewayRef =
    typeof tx.metadata?.gatewayRef === "string" ? tx.metadata.gatewayRef : null;

  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <span
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full",
          TONE_CLASSES[tone].soft,
          TONE_CLASSES[tone].text,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </span>

      <div className="min-w-0 flex-1">
        <p className="break-words font-medium text-foreground">
          {tx.description || humanizeStatus(tx.type)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <time dateTime={tx.createdAt}>
            {DHAKA_TIME.format(new Date(tx.createdAt))}
          </time>
          {" · "}
          {humanizeStatus(tx.type)}
        </p>
        {gatewayId && (
          <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="shrink-0">Txn</span>
            <span
              className="min-w-0 truncate font-mono text-foreground/80"
              title={gatewayId}
            >
              {gatewayId}
            </span>
            <CopyButton value={gatewayId} label="Transaction ID" className="size-6" />
            {gatewayRef && (
              <span className="hidden shrink-0 sm:inline">· Ref {gatewayRef}</span>
            )}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "font-semibold tabular-nums",
            kind === "credit" || kind === "refund"
              ? "text-success"
              : kind === "debit"
                ? "text-foreground"
                : "text-muted-foreground",
          )}
        >
          {sign}
          {formatBDT(amountMinor)}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {kind === "hold" || kind === "release"
            ? label
            : `Bal ${formatBDT(tx.balanceAfterMinor)}`}
        </p>
      </div>
    </li>
  );
}

export default function WalletTransactions({
  transactions,
}: {
  transactions: WalletTransaction[];
}) {
  const today = dhakaToday();

  // Newest first from the API, so each day's rows are already together.
  const days: { ymd: string; rows: WalletTransaction[] }[] = [];
  for (const tx of transactions) {
    const ymd = DHAKA_DAY.format(new Date(tx.createdAt));
    const last = days.at(-1);
    if (last?.ymd === ymd) last.rows.push(tx);
    else days.push({ ymd, rows: [tx] });
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {days.map((day) => (
        <section key={day.ymd} aria-label={dayLabel(day.ymd, today)}>
          <h3 className="border-b border-border bg-surface-subtle px-4 py-2 text-xs font-semibold text-muted-foreground">
            {dayLabel(day.ymd, today)}
          </h3>
          <ul className="divide-y divide-border">
            {day.rows.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
