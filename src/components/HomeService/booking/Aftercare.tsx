"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, Loader2, Scale, Star } from "lucide-react";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { appealHomeBooking } from "@/services/home-service/appealHomeBooking";
import { reportHomeBooking } from "@/services/home-service/reportHomeBooking";
import { reviewHomeBooking } from "@/services/home-service/reviewHomeBooking";
import type {
  HomeBooking,
  HomeBookingStatus,
  HomeSafetyKind,
  HomeSafetyReportInput,
  HomeSafetyReportReceipt,
} from "@/services/home-service/types";
import { homeErrorMessage } from "./errors";

const HOUR_MS = 60 * 60 * 1000;
/** `REVIEW_WINDOW_MS` on the server. */
const REVIEW_WINDOW_MS = 14 * 24 * HOUR_MS;

const CARD = "rounded-3xl border border-border bg-surface p-4 sm:p-5";

const REPORT_KINDS: { kind: HomeSafetyKind; label: string }[] = [
  { kind: "QUALITY", label: "Service quality" },
  { kind: "SAFETY", label: "I felt unsafe" },
  { kind: "HARASSMENT", label: "Harassment" },
  { kind: "MISMATCH", label: "Not who or what was booked" },
  { kind: "OTHER", label: "Something else" },
];

/** A visit that never got paid for has nothing to report about (`REPORTABLE` on the server). */
const UNREPORTABLE: HomeBookingStatus[] = ["PENDING_PAYMENT", "EXPIRED"];

const reachedAt = (b: HomeBooking, status: HomeBookingStatus) =>
  b.timeline.find((e) => e.toStatus === status)?.createdAt ?? null;

/**
 * What's left to do once a visit has ended: review a completed one within 14
 * days, appeal a kept fee inside the policy's window. The server decides both;
 * this only hides what it would refuse.
 */
export function VisitAftercare({
  booking: b,
  ask,
  onChanged,
  refresh,
}: {
  booking: HomeBooking;
  ask: "review" | "appeal" | null;
  onChanged: (b: HomeBooking) => void;
  refresh: () => Promise<HomeBooking | null>;
}) {
  const [now] = useState(() => Date.now());
  const completedAt = reachedAt(b, "COMPLETED");
  const reviewOpen =
    b.status === "COMPLETED" && !b.review && !!completedAt && now - new Date(completedAt).getTime() <= REVIEW_WINDOW_MS;
  const endedAt = b.cancelledAt ?? reachedAt(b, "NO_SHOW");
  const appealOpen =
    b.feeMinor > 0 &&
    !b.appealStatus &&
    !!endedAt &&
    now <= new Date(endedAt).getTime() + b.policy.appealWindowHours * HOUR_MS;

  return (
    <>
      {reviewOpen && <ReviewCard booking={b} focus={ask === "review"} refresh={refresh} />}
      {b.review && <GivenReview review={b.review} />}
      {appealOpen && <AppealCard booking={b} startOpen={ask === "appeal"} onChanged={onChanged} />}
      {b.appealStatus && <AppealStatus status={b.appealStatus} />}
    </>
  );
}

function ReviewCard({
  booking: b,
  focus,
  refresh,
}: {
  booking: HomeBooking;
  focus: boolean;
  refresh: () => Promise<HomeBooking | null>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ block: "center" });
  }, [focus]);

  const submit = async () => {
    setPending(true);
    const res = await reviewHomeBooking(b.id, { rating, comment: comment.trim() || undefined }, b.expert.id);
    if (res.success) toast.success("Thanks for your review");
    else toast.error(homeErrorMessage(res));
    // A review from another tab answers ALREADY_REVIEWED: this brings it in.
    if (res.success || res.errorCode === "ALREADY_REVIEWED") await refresh();
    setPending(false);
  };

  return (
    <section ref={ref} aria-label="Review your visit" className={CARD}>
      <p className="font-semibold text-foreground">How was {b.expert.name}?</p>
      <div role="radiogroup" aria-label="Your rating" className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className="grid size-11 cursor-pointer place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={cn("size-7", n <= rating ? "fill-gold text-gold" : "text-muted-foreground")} aria-hidden />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="hs-review-comment">Anything to add? (optional)</Label>
            <Textarea
              id="hs-review-comment"
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <Button disabled={pending} onClick={submit}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Post review
          </Button>
        </div>
      )}
    </section>
  );
}

function GivenReview({ review }: { review: NonNullable<HomeBooking["review"]> }) {
  return (
    <section aria-label="Your review" className={CARD}>
      <p className="text-sm font-medium text-muted-foreground">Your review</p>
      <p className="mt-1 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn("size-4", n <= review.rating ? "fill-gold text-gold" : "text-muted-foreground")} aria-hidden />
        ))}
      </p>
      {review.comment && <p className="mt-2 text-sm text-foreground">{review.comment}</p>}
    </section>
  );
}

function AppealCard({
  booking: b,
  startOpen,
  onChanged,
}: {
  booking: HomeBooking;
  startOpen: boolean;
  onChanged: (b: HomeBooking) => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    const res = await appealHomeBooking(b.id, reason.trim());
    setPending(false);
    if (!res.success || !res.data) return void toast.error(homeErrorMessage(res));
    toast.success("Appeal sent");
    onChanged(res.data);
    setOpen(false);
  };

  return (
    <section aria-label="Appeal the fee" className={CARD}>
      <p className="text-sm text-foreground">
        {formatBDT(b.feeMinor)} was kept. If that isn&apos;t right, you can appeal within {b.policy.appealWindowHours} hours of the visit
        ending.
      </p>
      <Button variant="outline" className="mt-3" onClick={() => setOpen(true)}>
        <Scale aria-hidden /> Appeal
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`Appeal ${formatBDT(b.feeMinor)}`}
        description="Tell us what happened. You can appeal once, and we decide within 48 hours."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button disabled={reason.trim().length < 3 || pending} onClick={submit}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Send appeal
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="hs-appeal-reason">What happened?</Label>
          <Textarea id="hs-appeal-reason" rows={4} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </ResponsiveDialog>
    </section>
  );
}

const APPEAL_LINE = {
  PENDING: { tone: "warning", text: "We have your appeal and will decide within 48 hours." },
  APPROVED: { tone: "success", text: "Your appeal was upheld. The fee is back in your wallet." },
  REJECTED: { tone: "neutral", text: "We looked at your appeal and the fee stands." },
} as const;

function AppealStatus({ status }: { status: NonNullable<HomeBooking["appealStatus"]> }) {
  const { tone, text } = APPEAL_LINE[status];
  return <p className={cn("rounded-2xl p-4 text-sm", TONE_CLASSES[tone].soft, TONE_CLASSES[tone].text)}>{text}</p>;
}

/** The customer's "Report a problem", for any paid visit. */
export function ReportButton({ booking: b }: { booking: HomeBooking }) {
  const [open, setOpen] = useState(false);
  if (UNREPORTABLE.includes(b.status)) return null;
  return (
    <>
      <Button variant="ghost" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag aria-hidden /> Report a problem
      </Button>
      <ReportDialog open={open} onOpenChange={setOpen} code={b.code} send={(input) => reportHomeBooking(b.id, input)} />
    </>
  );
}

/** A safety or quality report on a visit, from the customer or the expert. */
export function ReportDialog({
  open,
  onOpenChange,
  code,
  send,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  send: (input: HomeSafetyReportInput) => Promise<ApiResponse<HomeSafetyReportReceipt>>;
}) {
  const [kind, setKind] = useState<HomeSafetyKind>("QUALITY");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    const res = await send({ kind, details: details.trim() });
    setPending(false);
    if (!res.success) return void toast.error(homeErrorMessage(res));
    toast.success("Thanks. Our team will look into it.");
    setDetails("");
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Report a problem with ${code}`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled={details.trim().length < 10 || pending} onClick={submit}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Send report
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div role="radiogroup" aria-label="What's the problem?" className="flex flex-wrap gap-2">
          {REPORT_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              role="radio"
              aria-checked={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                kind === k.kind
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/60",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`hs-report-${code}`}>Tell us what happened</Label>
          <Textarea
            id={`hs-report-${code}`}
            rows={4}
            maxLength={2000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">10 characters or more.</p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
