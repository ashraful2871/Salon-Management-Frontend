"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBDT, toMinor, toTaka } from "@/lib/money";
import { SITE } from "@/lib/site";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import type { BalanceMethod, HomeAbortKind, HomeJob, HomeJobCompleteInput } from "@/services/home-service/types";

const METHODS: { method: BalanceMethod; label: string }[] = [
  { method: "CASH", label: "Cash" },
  { method: "BKASH_TO_SALON", label: "bKash to salon" },
  { method: "WALLET", label: "Paid in app" },
  { method: "NOT_COLLECTED", label: "Not collected" },
];

/** `collectedMinor`'s limit on the server. */
const MAX_COLLECT_MINOR = 10_000_000;

/** How the balance was taken; then the visit closes and the advance settles. */
export function CompleteDialog({
  open,
  onOpenChange,
  job,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: HomeJob;
  onConfirm: (input: HomeJobCompleteInput) => void;
}) {
  const [method, setMethod] = useState<BalanceMethod>("CASH");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // Each opening starts from the balance on the card.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMethod("CASH");
      setAmount(String(toTaka(job.balanceMinor)));
      setNote("");
    }
  }

  // The API sends 0 once it's paid in the app, so "Paid in app" below is only
  // ever the disabled reminder: WALLET is refused until the customer has paid.
  const nothingDue = job.balanceMinor === 0;
  const collectedMinor = toMinor(Number(amount));
  const validAmount =
    amount.trim() !== "" && Number.isFinite(collectedMinor) && collectedMinor >= 0 && collectedMinor <= MAX_COLLECT_MINOR;
  const differs = validAmount && collectedMinor !== job.balanceMinor;
  const notCollected = method === "NOT_COLLECTED";
  const noteTrimmed = note.trim();
  const ready = nothingDue || (validAmount && (!notCollected || noteTrimmed.length > 0));

  const confirm = () => {
    onOpenChange(false);
    if (nothingDue) {
      return onConfirm({ balanceMethod: job.balancePaidInApp ? "WALLET" : "CASH", collectedMinor: 0 });
    }
    onConfirm({ balanceMethod: method, collectedMinor, ...(noteTrimmed ? { note: noteTrimmed } : {}) });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Complete the visit"
      description={job.code}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button disabled={!ready} onClick={confirm}>
            Complete visit
          </Button>
        </>
      }
    >
      {nothingDue ? (
        <p className={cn("rounded-2xl p-4 text-sm", TONE_CLASSES.success.soft, TONE_CLASSES.success.text)}>
          {job.balancePaidInApp ? "Paid in app. Nothing to collect." : "Nothing to collect."}
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Balance to collect</p>
            <p className="text-3xl font-bold tabular-nums text-foreground">{formatBDT(job.balanceMinor)}</p>
          </div>
          <div role="radiogroup" aria-label="How was it paid?" className="grid grid-cols-2 gap-2">
            {METHODS.map(({ method: m, label }) => {
              const off = m === "WALLET";
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  disabled={off}
                  onClick={() => {
                    setMethod(m);
                    setAmount(m === "NOT_COLLECTED" ? "0" : String(toTaka(job.balanceMinor)));
                  }}
                  className={cn(
                    "min-h-14 cursor-pointer rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    method === m ? "border-primary bg-primary-soft text-foreground" : "border-border text-foreground",
                  )}
                >
                  {label}
                  {off && <span className="block text-xs font-normal text-muted-foreground">Not paid yet</span>}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`job-amount-${job.id}`}>Amount collected (৳)</Label>
            <Input
              id={`job-amount-${job.id}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={amount}
              className="h-12 text-lg tabular-nums"
              onChange={(e) => setAmount(e.target.value)}
            />
            {differs && !notCollected && (
              <p className="text-xs text-warning">That&apos;s different from the {formatBDT(job.balanceMinor)} balance.</p>
            )}
          </div>
          {(notCollected || differs) && (
            <div className="space-y-1.5">
              <Label htmlFor={`job-note-${job.id}`}>{notCollected ? "Why wasn't it collected?" : "Note (optional)"}</Label>
              <Textarea id={`job-note-${job.id}`} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          )}
        </div>
      )}
    </ResponsiveDialog>
  );
}

const ABORT_COPY: Record<HomeAbortKind, { title: string; text: string; reason: string; confirm: string; prefill: string }> = {
  MISMATCH: {
    title: "Recipient mismatch",
    text: "Stop this visit because the person or the place isn't what was booked. The cancellation rule applies to the customer.",
    reason: "What didn't match?",
    confirm: "Stop the visit",
    prefill: "",
  },
  SAFETY: {
    title: "Feel unsafe? Leave now",
    text: "Your safety comes first. This ends the visit, refunds the customer in full and tells our team.",
    reason: "What happened? (change this if you can)",
    confirm: "End visit and leave",
    prefill: "I felt unsafe and left.",
  },
};

/** Stopping a visit: a reason, then one button. Feeling unsafe has one filled in, so leaving takes a single tap. */
export function AbortDialog({
  kind,
  code,
  onClose,
  onConfirm,
}: {
  kind: HomeAbortKind | null;
  code: string;
  onClose: () => void;
  onConfirm: (kind: HomeAbortKind, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [shown, setShown] = useState(kind);
  if (kind !== shown) {
    setShown(kind);
    if (kind) setReason(ABORT_COPY[kind].prefill);
  }
  const copy = ABORT_COPY[kind ?? "MISMATCH"];
  const trimmed = reason.trim();

  return (
    <ResponsiveDialog
      open={kind !== null}
      onOpenChange={(o) => !o && onClose()}
      title={copy.title}
      description={code}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button
            variant="destructive"
            disabled={trimmed.length < 3}
            onClick={() => {
              if (!kind) return;
              onClose();
              onConfirm(kind, trimmed);
            }}
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-foreground">{copy.text}</p>
        <div className="space-y-1.5">
          <Label htmlFor={`job-abort-${code}`}>{copy.reason}</Label>
          <Textarea id={`job-abort-${code}`} rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
    </ResponsiveDialog>
  );
}

/** Support's number. The Help ticket is the customer's; an expert calls. */
export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Help"
      description="Call us during a visit, or use Report to tell us about something later."
    >
      <Button size="xl" className="w-full" asChild>
        <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
          <Phone aria-hidden /> Call {SITE.phone}
        </a>
      </Button>
    </ResponsiveDialog>
  );
}
