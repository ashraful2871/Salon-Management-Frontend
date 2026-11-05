"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarPlus,
  Check,
  CircleCheck,
  Clock,
  KeyRound,
  LifeBuoy,
  Loader2,
  MapPin,
  Phone,
  ReceiptText,
  RotateCcw,
  TimerOff,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { gatewayRefLabel, providerLabel, type ProviderId } from "@/lib/payment-providers";
import { TONE_CLASSES, toneOf } from "@/lib/status-tone";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { getHomeBooking } from "@/services/home-service/getHomeBooking";
import { homeHelp } from "@/services/home-service/homeHelp";
import type {
  HomeBooking,
  HomeBookingStatus,
  HomeHelpResult,
  HomePayment,
} from "@/services/home-service/types";
import type { PaymentMethodOption } from "@/services/payments/getPaymentMethods";
import { SIDES, trackSide } from "../content";
import { ExpertAvatar, RatingLine } from "../HomeCards";
import { ReportButton, VisitAftercare } from "./Aftercare";
import { CancelDialog, RescheduleDialog } from "./ManageDialogs";
import { DisclaimerBox, PaymentCountdown } from "./Disclaimer";
import { homeErrorMessage } from "./errors";
import { dayText, timeText } from "./format";
import { GatewayRedirectOverlay, PayPanel, useHomePay } from "./PayPanel";

const STATUS_STEPS: { status: HomeBookingStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "EN_ROUTE", label: "On the way" },
  { status: "ARRIVED", label: "Arrived" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "COMPLETED", label: "Done" },
];

const LIVE: HomeBookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
];
const UNDER_WAY: HomeBookingStatus[] = ["EN_ROUTE", "ARRIVED", "IN_PROGRESS"];
const POLL_MS = 30_000;
const PAYMENT_POLL_MS = 4_000;
const PAYMENT_POLL_TRIES = 15;

const STATUS_TITLE: Record<HomeBookingStatus, string> = {
  PENDING_PAYMENT: "Finish paying to confirm",
  CONFIRMED: "Your visit is confirmed",
  EN_ROUTE: "Your expert is on the way",
  ARRIVED: "Your expert has arrived",
  IN_PROGRESS: "Your visit is in progress",
  COMPLETED: "Visit done",
  CANCELLED: "Booking cancelled",
  NO_SHOW: "Marked as a no-show",
  EXPIRED: "This booking expired",
};

const CANCELLED_BY: Record<string, string> = {
  CUSTOMER: "You cancelled this visit.",
  SALON: "The salon cancelled this visit.",
  ADMIN: "Our support team cancelled this visit.",
  SYSTEM: "This visit was cancelled automatically.",
};

const ics = (b: HomeBooking) => {
  const stamp = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const esc = (s: string) =>
    s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const where = [b.address.addressLine, b.address.area]
    .filter(Boolean)
    .join(", ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Home Service//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@home-service`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(b.startAt)}`,
    `DTEND:${stamp(b.endAt)}`,
    `SUMMARY:${esc(`${SIDES[b.audience].title}: ${b.services.join(", ")} (${b.code})`)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`${b.expert.name} from ${b.salon.name}. Booking ${b.code}.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

const downloadIcs = (b: HomeBooking) => {
  const url = URL.createObjectURL(
    new Blob([ics(b)], { type: "text/calendar;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.code}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const rebookHref = (b: HomeBooking) =>
  `/home-service/book?${new URLSearchParams({ expert: b.expert.id, items: b.items.map((i) => i.offeringId).join(",") }).toString()}`;

/**
 * One visit as its customer sees it: pay (with the window's countdown), then
 * the code, the live status, the start code, the accepted terms and the ways
 * to change it. While active it re-reads itself every 30 s with the tab
 * visible, and on focus. `embedded` lays it out for the dashboard's detail sheet.
 */
export default function HomeBookingView({
  initial,
  methods,
  via,
  payOutcome = null,
  retryMethod,
  embedded = false,
  ask = null,
}: {
  initial: HomeBooking;
  methods: PaymentMethodOption[];
  /** Back from a gateway trip for this visit's advance. */
  via: "bkash" | "sslcommerz" | null;
  /** The gateway said the payment didn't go through (the visit is the truth either way). */
  payOutcome?: "failed" | "cancelled" | null;
  retryMethod: ProviderId | null;
  embedded?: boolean;
  /** From an email's link: go straight to the review or the appeal. */
  ask?: "review" | "appeal" | null;
}) {
  const [b, setB] = useState(initial);
  const [checkingPayment, setCheckingPayment] = useState(
    via !== null && payOutcome === null && initial.status === "PENDING_PAYMENT",
  );
  const [help, setHelp] = useState<HomeHelpResult | null>(null);
  const [helpPending, setHelpPending] = useState(false);
  const [dialog, setDialog] = useState<"cancel" | "reschedule" | null>(null);
  const { pay, pending: paying, redirecting } = useHomePay();
  // Shown once, on the way back from paying: what was paid and its receipt number.
  const justPaid = via !== null && payOutcome === null && initial.status === "PENDING_PAYMENT";

  const refresh = useCallback(async () => {
    const res = await getHomeBooking(initial.id);
    if (res.success && res.data) setB(res.data);
    return res.data ?? null;
  }, [initial.id]);

  // The light poll: active visits only, visible tab only, plus a read on focus.
  const live = LIVE.includes(b.status);
  useEffect(() => {
    if (!live) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      if (document.visibilityState === "visible")
        timer = setInterval(() => void refresh(), POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
      start();
    };
    const onFocus = () => void refresh();
    start();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [live, refresh]);

  // Back from the gateway: the callback may land a moment after the customer does.
  useEffect(() => {
    if (!checkingPayment) return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const next = await refresh();
      if (
        (next && next.status !== "PENDING_PAYMENT") ||
        tries >= PAYMENT_POLL_TRIES
      ) {
        clearInterval(timer);
        setCheckingPayment(false);
      }
    }, PAYMENT_POLL_MS);
    return () => clearInterval(timer);
  }, [checkingPayment, refresh]);

  // Count a gateway payment once, then drop the return params from the URL.
  const tracked = useRef(false);
  useEffect(() => {
    if (!via || tracked.current || b.status === "PENDING_PAYMENT") return;
    tracked.current = true;
    const key = `hs_paid_${b.id}`;
    try {
      if (b.status === "CONFIRMED" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        track("home_booking_paid", `${trackSide(b.audience)},method:${via}`);
      }
    } catch {
      // Storage blocked: skip the count rather than risk a double one.
    }
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
  }, [via, b.status, b.id, b.audience]);

  const askHelp = async () => {
    setHelpPending(true);
    const res = await homeHelp(b.id);
    setHelpPending(false);
    if (!res.success || !res.data)
      return void toast.error(homeErrorMessage(res));
    setHelp(res.data);
  };

  const tone = toneOf(b.status);
  const stepIndex = STATUS_STEPS.findIndex((s) => s.status === b.status);
  const confirmedLike = stepIndex >= 0;
  const when = `${dayText(b.serviceDate)} · ${timeText(b.startAt)}–${timeText(b.endAt)}`;
  const Title = embedded ? "h2" : "h1";

  return (
    <div
      className={
        embedded
          ? "space-y-5"
          : "container mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 md:py-10"
      }
    >
      <header className="space-y-2">
        <p className="text-overline font-semibold uppercase tracking-[0.06em] text-primary">
          {SIDES[b.audience].title}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Title className="font-display text-title-lg text-foreground font-bold">
            {STATUS_TITLE[b.status]}
          </Title>
          <span
            className={cn(
              "rounded-full px-3 py-1 font-mono text-sm font-semibold",
              TONE_CLASSES[tone].soft,
              TONE_CLASSES[tone].text,
            )}
          >
            {b.code}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{when}</p>
      </header>

      {b.status === "PENDING_PAYMENT" &&
        (checkingPayment ? (
          <Card>
            <div role="status" className="flex items-center gap-3">
              <Loader2 className="size-6 shrink-0 animate-spin text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-foreground">
                  Confirming your payment with {providerLabel(via?.toUpperCase())}…
                </p>
                <p className="text-sm text-muted-foreground">
                  This usually takes a few seconds. Please keep this page open.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {payOutcome && (
              <div
                role="alert"
                className={cn("flex gap-3 rounded-2xl border border-warning/40 p-4 text-sm", TONE_CLASSES.warning.soft)}
              >
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                <div>
                  <p className="font-semibold text-foreground">
                    {payOutcome === "cancelled" ? "You cancelled the payment" : "The payment didn't go through"}
                  </p>
                  <p className="text-muted-foreground">
                    Nothing was charged. Your time is still held, so you can try again below, with the same method or another one.
                  </p>
                </div>
              </div>
            )}
            {b.expiresAt && <PaymentCountdown until={b.expiresAt} onExpire={() => void refresh()} />}
            <PayPanel
              title="Pay the advance to confirm"
              amountMinor={b.advanceMinor}
              balanceMinor={b.balanceMinor}
              methods={methods}
              initialMethod={retryMethod ?? (via ? (via.toUpperCase() as ProviderId) : null)}
              pending={paying}
              onPay={async (m) => {
                const out = await pay(b.id, b.audience, m);
                if (out.kind === "paid") setB(out.booking);
                else if (
                  out.kind === "failed" &&
                  out.errorCode &&
                  ["PAYMENT_EXPIRED", "INVALID_STATE"].includes(out.errorCode)
                )
                  void refresh();
              }}
            />
          </div>
        ))}

      {justPaid && b.status === "CONFIRMED" && b.payments?.[0] && (
        <section
          role="status"
          className={cn("flex gap-3 rounded-3xl border border-success/30 p-4 sm:p-5", TONE_CLASSES.success.soft)}
        >
          <CircleCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              Payment received: {formatBDT(b.payments[0].amountMinor)} via {providerLabel(b.payments[0].provider)}
            </p>
            <p className="text-muted-foreground">
              Your visit is booked. A confirmation is on its way to your email.
              {b.payments[0].gatewayRef && (
                <>
                  {" "}
                  {gatewayRefLabel(b.payments[0].provider)}:{" "}
                  <span className="font-mono text-foreground">{b.payments[0].gatewayRef}</span>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {b.status === "EXPIRED" && (
        <Card>
          <div className="flex gap-3">
            <TimerOff
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                The time to pay ran out, so the time was let go.
                {b.payments?.length
                  ? " Your payment arrived after that, so it is being refunded automatically to the account you paid with."
                  : " Nothing was charged."}
              </p>
              <Button asChild>
                <Link href={rebookHref(b)}>
                  <RotateCcw aria-hidden /> Book again
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {(b.status === "CANCELLED" || b.status === "NO_SHOW") && (
        <Card>
          <div className="flex gap-3">
            <XCircle
              className="mt-0.5 size-5 shrink-0 text-danger"
              aria-hidden
            />
            <div className="space-y-1 text-sm">
              <p className="text-foreground">
                {b.status === "CANCELLED"
                  ? (CANCELLED_BY[b.cancelledBy ?? ""] ??
                    "This visit was cancelled.")
                  : b.noShowParty === "EXPERT"
                    ? "The expert didn't come. Your advance is back in full."
                    : "The expert waited, but nobody was there to meet them."}
              </p>
              {b.cancelReason && (
                <p className="text-muted-foreground">
                  Reason: {b.cancelReason}
                </p>
              )}
              {(b.refundedMinor ?? 0) > 0 && (
                <p className="font-medium text-success">
                  {formatBDT(b.refundedMinor ?? 0)} {refundDestination(b.payments)}.
                </p>
              )}
              {b.feeMinor > 0 && (
                <p className="text-muted-foreground">
                  {formatBDT(b.feeMinor)} was kept under the cancellation rule.
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={rebookHref(b)}>
              <RotateCcw aria-hidden /> Book again
            </Link>
          </Button>
        </Card>
      )}

      {confirmedLike && (
        <>
          <StatusSteps index={stepIndex} />

          {b.startCode && (
            <section
              aria-label="Start code"
              className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-primary/50 bg-primary-soft p-5"
            >
              <KeyRound className="size-8 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Your start code
                </p>
                <p className="font-mono text-3xl font-bold tracking-[0.3em] text-foreground">
                  {b.startCode}
                </p>
                <p className="text-xs text-muted-foreground">
                  Give this code to your expert when they arrive — keep it
                  private.
                </p>
              </div>
            </section>
          )}

          {b.status === "COMPLETED" && (
            <Card>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CircleCheck className="size-5 text-success" aria-hidden />{" "}
                Thanks for booking. We hope you loved it.
              </p>
            </Card>
          )}
        </>
      )}

      <VisitAftercare
        booking={b}
        ask={ask}
        onChanged={setB}
        refresh={refresh}
      />

      <Card>
        <div className="flex items-center gap-3">
          <ExpertAvatar
            name={b.expert.name}
            photo={b.expert.photo}
            className="size-12"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{b.expert.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {b.salon.name}
            </p>
            <RatingLine
              rating={b.expert.rating}
              reviews={b.expert.totalReviews}
            />
          </div>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <Row icon={Clock} label="When">
            {when}
          </Row>
          <Row icon={MapPin} label="Where">
            {[b.address.addressLine, b.address.area].filter(Boolean).join(", ")}
            {b.address.landmark && (
              <span className="block text-muted-foreground">
                Near {b.address.landmark}
              </span>
            )}
            <span className="block text-muted-foreground">
              For {b.recipientName} · {b.contactPhone}
            </span>
          </Row>
        </dl>
      </Card>

      <Card>
        <dl className="space-y-1.5 text-sm">
          {b.items.map((it) => (
            <div key={it.offeringId} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{it.name}</dt>
              <dd className="tabular-nums">{formatBDT(it.priceMinor)}</dd>
            </div>
          ))}
          {b.travelFeeMinor > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Travel fee</dt>
              <dd className="tabular-nums">{formatBDT(b.travelFeeMinor)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBDT(b.totalMinor)}</dd>
          </div>
          {b.status !== "PENDING_PAYMENT" && b.status !== "EXPIRED" && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Advance paid online</dt>
                <dd className="tabular-nums">{formatBDT(b.advanceMinor)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">
                  {b.balanceHeldInApp
                    ? "Rest (paid in the app)"
                    : LIVE.includes(b.status)
                      ? "Pay at home (cash or bKash)"
                      : "Rest, paid at home"}
                </dt>
                <dd className="tabular-nums">{formatBDT(b.balanceMinor)}</dd>
              </div>
            </>
          )}
        </dl>
        {b.payments && b.payments.length > 0 && <PaymentsList payments={b.payments} />}
      </Card>

      {b.disclaimerText && (
        <DisclaimerBox
          policy={b.policy.policy}
          text={b.disclaimerText}
          acceptedAt={b.policyAcceptedAt}
        />
      )}

      {confirmedLike && b.status !== "COMPLETED" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadIcs(b)}>
            <CalendarPlus aria-hidden /> Add to calendar
          </Button>
          {b.status === "CONFIRMED" && (
            <Button variant="outline" onClick={() => setDialog("reschedule")}>
              <RotateCcw aria-hidden /> Reschedule
            </Button>
          )}
          {(b.status === "CONFIRMED" || b.status === "EN_ROUTE") && (
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              onClick={() => setDialog("cancel")}
            >
              <XCircle aria-hidden /> Cancel visit
            </Button>
          )}
          {UNDER_WAY.includes(b.status) && (
            <Button
              variant="outline"
              className="border-danger/40 text-danger hover:text-danger"
              disabled={helpPending}
              onClick={askHelp}
            >
              {helpPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <LifeBuoy aria-hidden />
              )}{" "}
              Help
            </Button>
          )}
        </div>
      )}

      {help && (
        <section
          role="status"
          className={cn("rounded-2xl p-4 text-sm", TONE_CLASSES.danger.soft)}
        >
          <p className="font-semibold text-foreground">
            Support has your request (ticket #{help.ticketNumber}). If you feel
            unsafe, call now:
          </p>
          <Button asChild className="mt-3">
            <a href={`tel:${help.supportPhone.replace(/\s/g, "")}`}>
              <Phone aria-hidden /> {help.supportPhone}
            </a>
          </Button>
        </section>
      )}

      <ReportButton booking={b} />
      <GatewayRedirectOverlay provider={redirecting} />

      {!embedded && (
        <p className="text-center text-sm">
          <Link
            href="/dashboard/home-bookings"
            className="text-primary hover:underline"
          >
            All my home bookings
          </Link>
        </p>
      )}

      <CancelDialog
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
        booking={b}
        onDone={setB}
        onReschedule={() => setDialog("reschedule")}
      />
      <RescheduleDialog
        open={dialog === "reschedule"}
        onOpenChange={(o) => setDialog(o ? "reschedule" : null)}
        booking={b}
        onDone={setB}
      />
    </div>
  );
}

/** Where a refund went, in words: the gateway that took the payment. */
const refundDestination = (payments?: HomePayment[]) => {
  const p = payments?.[0];
  if (!p) return "went back to you";
  const processing = p.refunds.length === 0 || p.refunds.some((r) => r.status === "PROCESSING");
  const where = p.provider === "BKASH" ? "your bKash account" : "your card or mobile banking account";
  return processing ? `is being refunded to ${where}` : `was refunded to ${where}`;
};

/** The receipt: each online payment, its reference, and each refund with its state. */
function PaymentsList({ payments }: { payments: HomePayment[] }) {
  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ReceiptText className="size-4 text-muted-foreground" aria-hidden /> Payment
      </p>
      {payments.map((p) => (
        <div key={p.transactionId} className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-foreground">
              Paid with{" "}
              {p.method && p.method !== providerLabel(p.provider)
                ? `${providerLabel(p.provider)} · ${p.method}`
                : providerLabel(p.provider)}
              {p.paidAt && (
                <span className="block text-xs text-muted-foreground">
                  {new Date(p.paidAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}
                </span>
              )}
            </span>
            <span className="tabular-nums text-foreground">{formatBDT(p.amountMinor)}</span>
          </div>
          {p.gatewayRef && (
            <p className="text-xs text-muted-foreground">
              {gatewayRefLabel(p.provider)}: <span className="font-mono text-foreground">{p.gatewayRef}</span>
            </p>
          )}
          {p.refunds.map((r, i) => (
            <div key={i} className="flex justify-between gap-3 text-xs">
              <span className={r.status === "REFUNDED" ? "text-success" : "text-muted-foreground"}>
                {r.status === "REFUNDED" ? "Refunded" : "Refund processing"} to {providerLabel(p.provider)}
              </span>
              <span className="tabular-nums">−{formatBDT(r.amountMinor)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
      {children}
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="sr-only">{label}</dt>
        <dd className="text-foreground">{children}</dd>
      </div>
    </div>
  );
}

function StatusSteps({ index }: { index: number }) {
  return (
    <ol aria-label="Visit status" className="grid grid-cols-5 gap-1">
      {STATUS_STEPS.map((s, i) => {
        const done = i < index || (i === index && s.status === "COMPLETED");
        const current = i === index && !done;
        return (
          <li
            key={s.status}
            aria-current={current ? "step" : undefined}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-xs font-semibold",
                done && "bg-success text-white",
                current &&
                  "bg-primary text-primary-foreground ring-4 ring-primary-soft",
                !done && !current && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[11px] leading-tight sm:text-xs",
                current
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
