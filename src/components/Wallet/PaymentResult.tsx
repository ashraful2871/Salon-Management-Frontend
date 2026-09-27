"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowLeftRight,
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Printer,
  RefreshCcw,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import CopyButton from "./CopyButton";
import {
  checkTopupStatus,
  type TopupIntentStatus,
  type TopupStatus,
} from "@/services/wallet/checkTopupStatus";
import { formatBDT } from "@/lib/money";
import {
  gatewayRefLabel,
  providerLabel,
  type ProviderId,
} from "@/lib/payment-providers";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";

/** What the gateway sent the customer back to. */
type Outcome = "success" | "failed" | "cancelled";
/** What this page is actually showing, once the intent has been read back. */
type View = Outcome | "verifying" | "unresolved";

const POLL_INTERVAL_MS = 2500;
/**
 * The spinner has to end. Past this the page says so in words and offers a
 * manual re-check, because a customer told to "please wait" indefinitely
 * assumes their money is gone.
 */
const POLL_TIMEOUT_MS = 60_000;

const viewForStatus = (status: TopupIntentStatus): View | null => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "CANCELLED":
      return "cancelled";
    case "FAILED":
    case "EXPIRED":
      return "failed";
    default:
      return null;
  }
};

const VIEWS: Record<
  View,
  { title: string; body: string; badge: string; tone: Tone; icon: React.ReactNode }
> = {
  verifying: {
    title: "Confirming your payment",
    body: "We are checking with the payment gateway. This usually takes a few seconds, so please do not close this page.",
    badge: "Processing",
    tone: "info",
    icon: <Loader2 className="size-9 animate-spin" />,
  },
  success: {
    title: "Payment successful",
    body: "Your money has been added to your wallet and a receipt is on its way to your email.",
    badge: "Paid",
    tone: "success",
    icon: <CheckCircle2 className="size-9" />,
  },
  failed: {
    title: "Payment failed",
    body: "The payment did not go through, so nothing has been added to your wallet. If your card or mobile account was charged, it is returned automatically.",
    badge: "Failed",
    tone: "danger",
    icon: <XCircle className="size-9" />,
  },
  cancelled: {
    title: "Payment cancelled",
    body: "You cancelled this payment before it completed. Nothing was charged and your wallet is unchanged.",
    badge: "Cancelled",
    tone: "warning",
    icon: <Ban className="size-9" />,
  },
  unresolved: {
    title: "Still confirming your payment",
    body: "The gateway has not confirmed this one yet. Your money is safe: if it was taken, the payment is checked again automatically and your wallet is credited. You can also check again below.",
    badge: "Pending",
    tone: "warning",
    icon: <Clock className="size-9" />,
  },
};

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
    <div className="flex min-w-0 items-center justify-end gap-1 text-right text-sm font-medium text-foreground">
      {children}
    </div>
  </div>
);

const MonoValue = ({ value, label }: { value: string; label: string }) => (
  <>
    <span className="truncate font-mono text-xs sm:text-sm" title={value}>
      {value}
    </span>
    <CopyButton value={value} label={label} />
  </>
);

export default function PaymentResult({
  outcome,
  transactionId,
  resumeChat = false,
}: {
  outcome: Outcome;
  transactionId?: string;
  /** The top-up was started from the booking chat (`sm_chat_resume` is set):
   *  lead back there, where the booking finishes. */
  resumeChat?: boolean;
}) {
  const router = useRouter();
  const [intent, setIntent] = useState<TopupStatus | null>(null);
  // A success return with no transaction id is the one case that cannot be
  // verified, so it opens on the honest answer rather than on a spinner.
  const [view, setView] = useState<View>(() =>
    outcome === "success"
      ? transactionId
        ? "verifying"
        : "unresolved"
      : outcome
  );
  // Bumping this re-runs the poll, which is what "Check again" does.
  const [attempt, setAttempt] = useState(0);
  // Where "Try another method" points: the gateway this attempt did not use.
  const otherProvider: ProviderId | null =
    intent?.provider === "BKASH"
      ? "SSLCOMMERZ"
      : intent?.provider === "SSLCOMMERZ"
        ? "BKASH"
        : null;

  useEffect(() => {
    // Nothing to poll with - the initial view already says so.
    if (!transactionId) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const poll = async () => {
      const res = await checkTopupStatus(transactionId);
      if (stopped) return;

      if (res.success && res.data) {
        setIntent(res.data);

        const resolved = viewForStatus(res.data.status);
        if (resolved) {
          setView(resolved);
          if (resolved === "success") {
            // The dashboard shell is server-rendered, so it only picks the
            // top-up up when the route re-renders.
            router.refresh();
          }
          return;
        }
      }

      // A fail or cancel return already knows how the payment ended; the intent
      // row is only catching up. No reason to hold the customer here.
      if (outcome !== "success") {
        setView(outcome);
        return;
      }

      if (Date.now() >= deadline) {
        setView("unresolved");
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [transactionId, outcome, attempt, router]);

  const checkAgain = useCallback(() => {
    setView("verifying");
    setAttempt((n) => n + 1);
  }, []);

  const shown = VIEWS[view];
  const paidAt = intent?.completedAt ?? intent?.createdAt;
  const retry = view === "failed" || view === "cancelled";

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-2 sm:py-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          aria-hidden="true"
          className={cn(
            "grid size-20 place-items-center rounded-full",
            TONE_CLASSES[shown.tone].soft,
            TONE_CLASSES[shown.tone].text,
          )}
        >
          {shown.icon}
        </div>

        <div className="space-y-2" aria-live="polite">
          <h1 className="font-display text-title-lg text-foreground">
            {shown.title}
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {shown.body}
          </p>
        </div>

        {intent && (
          <p
            className={cn(
              "text-3xl font-bold tracking-tight tabular-nums",
              view === "success" ? "text-success" : "text-foreground",
            )}
          >
            {view === "success" ? "+" : ""}
            {formatBDT(intent.amountMinor)}
          </p>
        )}

        <ToneBadge status={view} tone={shown.tone} dot>
          {shown.badge}
        </ToneBadge>
      </div>

      {(intent || transactionId) && (
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface print:border-0">
          {transactionId && (
            <Row label="Transaction ID">
              <MonoValue value={transactionId} label="Transaction ID" />
            </Row>
          )}

          {intent?.gatewayRef && (
            <Row label={gatewayRefLabel(intent.provider)}>
              <MonoValue
                value={intent.gatewayRef}
                label={gatewayRefLabel(intent.provider)}
              />
            </Row>
          )}

          <Row label="Method">
            {[providerLabel(intent?.provider), intent?.method]
              .filter(Boolean)
              .join(" · ") || "N/A"}
          </Row>

          {paidAt && (
            <Row label="Time">{format(new Date(paidAt), "d MMM yyyy, h:mm a")}</Row>
          )}

          {intent?.failureReason && view !== "success" && (
            <Row label="Reason">
              <span className="text-right font-normal">{intent.failureReason}</span>
            </Row>
          )}

          {view === "success" && intent && (
            <Row label="Available balance">
              <span className="tabular-nums">
                {formatBDT(intent.walletAvailableMinor)}
              </span>
            </Row>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 print:hidden">
        {/* One primary action: the next step */}
        {view === "unresolved" ? (
          <Button onClick={checkAgain} className="w-full">
            <RefreshCcw /> Check again
          </Button>
        ) : retry ? (
          <Button asChild className="w-full">
            <Link href="/dashboard/wallet?add=1">
              <RotateCcw /> Try again
            </Link>
          </Button>
        ) : resumeChat ? (
          <Button asChild className="w-full">
            <Link href="/assistant?resume=1">
              <CalendarCheck /> Back to your booking
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/dashboard/wallet">
              <ArrowLeft /> Back to wallet
            </Link>
          </Button>
        )}

        {retry && otherProvider && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/dashboard/wallet?add=1&method=${otherProvider}`}>
              <ArrowLeftRight /> Pay with {providerLabel(otherProvider)} instead
            </Link>
          </Button>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {(view === "unresolved" || retry || resumeChat) && (
            <Button asChild variant="link">
              <Link href="/dashboard/wallet">Back to wallet</Link>
            </Button>
          )}
          {view === "success" && (
            <Button variant="link" onClick={() => window.print()}>
              <Printer /> Print receipt
            </Button>
          )}
        </div>
      </div>

      {view !== "success" && view !== "verifying" && (
        <p className="text-center text-xs text-muted-foreground print:hidden">
          Charged but not credited? Quote the transaction ID above to support and
          we will trace it.
        </p>
      )}
    </div>
  );
}
