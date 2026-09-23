"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CopyButton from "./CopyButton";
import {
  checkTopupStatus,
  type TopupIntentStatus,
  type TopupStatus,
} from "@/services/wallet/checkTopupStatus";
import { formatBDT } from "@/lib/money";
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

const HEADINGS: Record<
  View,
  { title: string; body: string; badge: string; badgeClass: string }
> = {
  verifying: {
    title: "Confirming your payment",
    body: "We are checking with the payment gateway. This usually takes a few seconds, so please do not close this page.",
    badge: "Processing",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  success: {
    title: "Payment successful",
    body: "Your money has been added to your wallet and a receipt is on its way to your email.",
    badge: "Paid",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  failed: {
    title: "Payment failed",
    body: "The payment did not go through, so nothing has been added to your wallet. If your card or mobile account was charged, it is returned automatically.",
    badge: "Failed",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  cancelled: {
    title: "Payment cancelled",
    body: "You cancelled this payment before it completed. Nothing was charged and your wallet is unchanged.",
    badge: "Cancelled",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  unresolved: {
    title: "Still confirming your payment",
    body: "The gateway has not confirmed this one yet. Your money is safe: if it was taken, the payment is checked again automatically and your wallet is credited. You can also check again below.",
    badge: "Pending",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const ICONS: Record<View, React.ReactNode> = {
  verifying: <Loader2 className="h-9 w-9 animate-spin text-blue-600" />,
  success: <CheckCircle2 className="h-9 w-9 text-green-600" />,
  failed: <XCircle className="h-9 w-9 text-red-600" />,
  cancelled: <Ban className="h-9 w-9 text-amber-600" />,
  unresolved: <Clock className="h-9 w-9 text-slate-500" />,
};

const ICON_BG: Record<View, string> = {
  verifying: "bg-blue-50",
  success: "bg-green-50",
  failed: "bg-red-50",
  cancelled: "bg-amber-50",
  unresolved: "bg-slate-100",
};

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <span className="text-sm text-muted-foreground">{label}</span>
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

  const heading = HEADINGS[view];
  const paidAt = intent?.completedAt ?? intent?.createdAt;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Card className="overflow-hidden shadow-soft print:border-0 print:shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-8 text-center">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full",
                ICON_BG[view]
              )}
            >
              {ICONS[view]}
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                {heading.title}
              </h1>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                {heading.body}
              </p>
            </div>

            {intent && (
              <p
                className={cn(
                  "mt-2 text-4xl font-bold tracking-tight",
                  view === "success" ? "text-green-600" : "text-foreground"
                )}
              >
                {view === "success" ? "+" : ""}
                {formatBDT(intent.amountMinor)}
              </p>
            )}

            <Badge
              variant="outline"
              className={cn(
                "text-xs uppercase tracking-wide",
                heading.badgeClass
              )}
            >
              {heading.badge}
            </Badge>
          </div>

          {(intent || transactionId) && (
            <>
              <Separator />
              <div className="px-6 py-2">
                <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment details
                </p>

                <div className="divide-y">
                  {transactionId && (
                    <Row label="Transaction ID">
                      <MonoValue value={transactionId} label="Transaction ID" />
                    </Row>
                  )}

                  {intent?.gatewayRef && (
                    <Row label="Gateway reference">
                      <MonoValue
                        value={intent.gatewayRef}
                        label="Gateway reference"
                      />
                    </Row>
                  )}

                  {intent && (
                    <Row label="Amount">{formatBDT(intent.amountMinor)}</Row>
                  )}

                  <Row label="Payment method">{intent?.method || "N/A"}</Row>

                  <Row label="Paid via">{intent?.provider || "SSLCommerz"}</Row>

                  {paidAt && (
                    <Row label="Date">
                      {format(new Date(paidAt), "MMM d, yyyy h:mm a")}
                    </Row>
                  )}

                  {intent?.failureReason && view !== "success" && (
                    <Row label="Reason">
                      <span className="text-right font-normal">
                        {intent.failureReason}
                      </span>
                    </Row>
                  )}

                  {view === "success" && intent && (
                    <Row label="Available balance">
                      {formatBDT(intent.walletAvailableMinor)}
                    </Row>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t bg-muted/30 px-6 py-5 sm:flex-row sm:justify-end print:hidden">
            {view === "unresolved" && (
              <Button variant="outline" onClick={checkAgain}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Check again
              </Button>
            )}

            {(view === "failed" || view === "cancelled") && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/wallet?add=1">
                  <RotateCcw className="mr-2 h-4 w-4" /> Try again
                </Link>
              </Button>
            )}

            {view === "success" && (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print receipt
              </Button>
            )}

            {resumeChat ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/wallet">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to wallet
                  </Link>
                </Button>
                <Button asChild className="bg-sage hover:bg-sage/90">
                  <Link href="/assistant?resume=1">
                    <CalendarCheck className="mr-2 h-4 w-4" /> Back to your
                    booking
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="bg-sage hover:bg-sage/90">
                <Link href="/dashboard/wallet">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to wallet
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {view !== "success" && view !== "verifying" && (
        <p className="text-center text-xs text-muted-foreground print:hidden">
          Charged but not credited? Quote the transaction ID above to support and
          we will trace it.
        </p>
      )}
    </div>
  );
}
