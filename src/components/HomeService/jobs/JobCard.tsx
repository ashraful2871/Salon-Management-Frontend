"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  Flag,
  KeyRound,
  LifeBuoy,
  Loader2,
  Lock,
  MapPin,
  MoreHorizontal,
  Navigation,
  Phone,
  ShieldAlert,
  UserRoundX,
  UserX,
} from "lucide-react";

import { ReportDialog } from "@/components/HomeService/booking/Aftercare";
import { homeErrorMessage } from "@/components/HomeService/booking/errors";
import { HOME_STATUS_LABEL, timeText } from "@/components/HomeService/booking/format";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { jobReport } from "@/services/home-service/jobReport";
import type { HomeAbortKind, HomeBookingStatus, HomeJob } from "@/services/home-service/types";
import { SIDES } from "../content";
import { AbortDialog, CompleteDialog, HelpDialog } from "./JobDialogs";
import type { JobActions } from "./useJobActions";

const OPEN_STATUSES: HomeBookingStatus[] = ["CONFIRMED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"];
const CODE_LENGTH = 4;
const MAIN_BUTTON = "h-14 w-full text-base";

const directionsUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const countdown = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** One visit on the expert's phone: what to collect, where to go, and one big next step. */
export default function JobCard({ job, now, actions }: { job: HomeJob; now: number; actions: JobActions }) {
  const [dialog, setDialog] = useState<"complete" | "noShow" | "report" | "help" | null>(null);
  const [abort, setAbort] = useState<HomeAbortKind | null>(null);
  const pending = actions.isPending(job.id);
  const open = OPEN_STATUSES.includes(job.status);

  const noShowLeft = job.noShowFrom ? new Date(job.noShowFrom).getTime() - now : null;
  const noShowReady = noShowLeft !== null && noShowLeft <= 0;

  const openComplete = () => {
    // The customer may have just paid in the app.
    void actions.reload(job.id);
    setDialog("complete");
  };

  return (
    <li
      id={`job-${job.id}`}
      aria-busy={pending}
      className={cn("rounded-3xl border border-border bg-surface p-4", !open && "opacity-80")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {timeText(job.startAt)}–{timeText(job.endAt)}
          </p>
          <p className="text-sm text-muted-foreground">{[job.area, SIDES[job.audience].title].filter(Boolean).join(" · ")}</p>
        </div>
        <ToneBadge status={job.status}>{HOME_STATUS_LABEL[job.status]}</ToneBadge>
      </div>

      <p className="mt-3 text-sm text-foreground">{job.services.map((s) => s.name).join(", ")}</p>
      <p className="text-sm text-muted-foreground">
        For {job.recipientFirstName} · <span className="font-mono">{job.code}</span>
      </p>

      {(open || job.status === "COMPLETED") && <Balance job={job} />}
      {open && <Where job={job} />}

      {open && (
        <div className="mt-4 space-y-2">
          <MainAction job={job} now={now} pending={pending} actions={actions} onComplete={openComplete} />
          {noShowLeft !== null && !noShowReady && (
            <p className="text-center text-sm text-muted-foreground">
              Customer not here? You can mark it in <span className="tabular-nums">{countdown(noShowLeft)}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-11 text-muted-foreground">
              <MoreHorizontal aria-hidden /> More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {job.status === "ARRIVED" && (
              <DropdownMenuItem className="min-h-11" disabled={!noShowReady} onSelect={() => setDialog("noShow")}>
                <UserRoundX aria-hidden /> Customer not here
                {noShowLeft !== null && !noShowReady && <span className="ml-auto tabular-nums">{countdown(noShowLeft)}</span>}
              </DropdownMenuItem>
            )}
            {(job.status === "ARRIVED" || job.status === "IN_PROGRESS") && (
              <DropdownMenuItem className="min-h-11" onSelect={() => setAbort("MISMATCH")}>
                <UserX aria-hidden /> Recipient mismatch
              </DropdownMenuItem>
            )}
            {(job.status === "EN_ROUTE" || job.status === "ARRIVED" || job.status === "IN_PROGRESS") && (
              <>
                <DropdownMenuItem variant="destructive" className="min-h-11" onSelect={() => setAbort("SAFETY")}>
                  <ShieldAlert aria-hidden /> Feel unsafe — leave
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="min-h-11" onSelect={() => setDialog("report")}>
              <Flag aria-hidden /> Report
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" onSelect={() => setDialog("help")}>
              <LifeBuoy aria-hidden /> Help
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CompleteDialog
        open={dialog === "complete"}
        onOpenChange={(o) => setDialog(o ? "complete" : null)}
        job={job}
        onConfirm={(input) => actions.complete(job.id, input)}
      />
      <ConfirmDialog
        open={dialog === "noShow"}
        onOpenChange={(o) => setDialog(o ? "noShow" : null)}
        title="Mark the customer as not here?"
        description="This ends the visit. The cancellation rule decides what the customer pays."
        confirmLabel="Customer not here"
        cancelLabel="Back"
        onConfirm={() => actions.noShow(job.id)}
      />
      <AbortDialog
        kind={abort}
        code={job.code}
        onClose={() => setAbort(null)}
        onConfirm={(kind, reason) => actions.abort(job.id, kind, reason)}
      />
      <ReportDialog
        open={dialog === "report"}
        onOpenChange={(o) => setDialog(o ? "report" : null)}
        code={job.code}
        send={(input) => jobReport(job.id, input)}
      />
      <HelpDialog open={dialog === "help"} onOpenChange={(o) => setDialog(o ? "help" : null)} />
    </li>
  );
}

function Balance({ job }: { job: HomeJob }) {
  if (job.balancePaidInApp) {
    return (
      <p
        className={cn(
          "mt-3 flex items-center gap-2 rounded-2xl p-3 text-sm font-semibold",
          TONE_CLASSES.success.soft,
          TONE_CLASSES.success.text,
        )}
      >
        <CircleCheck className="size-5" aria-hidden /> Paid in app. Nothing to collect.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-2xl bg-surface-subtle p-3">
      <p className="text-sm text-muted-foreground">{job.status === "COMPLETED" ? "Balance" : "Balance to collect"}</p>
      <p className="text-3xl font-bold tabular-nums text-foreground">{formatBDT(job.balanceMinor)}</p>
    </div>
  );
}

function Where({ job }: { job: HomeJob }) {
  if (!job.address) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden /> Address shows 2 hours before the visit
      </p>
    );
  }
  const { addressLine, landmark, notes, latitude, longitude } = job.address;
  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 text-foreground">
          {addressLine}
          {landmark && <span className="block text-muted-foreground">Near {landmark}</span>}
          {notes && <span className="block text-muted-foreground">Note: {notes}</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12" asChild>
          <a href={directionsUrl(latitude, longitude)} target="_blank" rel="noreferrer">
            <Navigation aria-hidden /> Directions
          </a>
        </Button>
        {job.contactPhone && (
          <Button variant="outline" className="h-12" asChild>
            <a href={`tel:${job.contactPhone}`}>
              <Phone aria-hidden /> Call
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function MainAction({
  job,
  now,
  pending,
  actions,
  onComplete,
}: {
  job: HomeJob;
  now: number;
  pending: boolean;
  actions: JobActions;
  onComplete: () => void;
}) {
  const spinner = pending && <Loader2 className="animate-spin" aria-hidden />;

  switch (job.status) {
    case "CONFIRMED": {
      const early = now < new Date(job.canSetOffFrom).getTime();
      return (
        <>
          <Button className={MAIN_BUTTON} disabled={pending || early} onClick={() => actions.setOff(job.id)}>
            {spinner} I&apos;m on my way
          </Button>
          {early && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Clock3 className="size-4" aria-hidden /> You can set off from {timeText(job.canSetOffFrom)}
            </p>
          )}
        </>
      );
    }
    case "EN_ROUTE":
      return (
        <Button className={MAIN_BUTTON} disabled={pending} onClick={() => actions.arrived(job.id)}>
          {spinner} I&apos;ve arrived
        </Button>
      );
    case "ARRIVED":
      return <StartCode job={job} pending={pending} actions={actions} />;
    case "IN_PROGRESS":
      return (
        <Button className={MAIN_BUTTON} disabled={pending} onClick={onComplete}>
          {spinner} Complete
        </Button>
      );
    default:
      return null;
  }
}

function StartCode({ job, pending, actions }: { job: HomeJob; pending: boolean; actions: JobActions }) {
  const [entering, setEntering] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // After a wrong code the server's count is newer than the card's.
  const [triesLeft, setTriesLeft] = useState<number | null>(null);
  const left = triesLeft ?? job.startCodeTriesLeft;

  if (left <= 0) {
    return (
      <p className={cn("flex items-center gap-2 rounded-2xl p-4 text-sm font-medium", TONE_CLASSES.warning.soft, TONE_CLASSES.warning.text)}>
        <CircleAlert className="size-5 shrink-0" aria-hidden /> Too many wrong codes. Ask the salon to start it.
      </p>
    );
  }

  const failed = (res: ApiResponse<HomeJob>) => {
    setCode("");
    if (res.errorCode === "START_CODE_LOCKED") return setTriesLeft(0);
    if (res.errorCode === "START_CODE_INVALID") {
      const next = res.details?.triesLeft;
      if (typeof next === "number") setTriesLeft(next);
      return setError("That code isn't right. Ask the customer to read it again.");
    }
    setError(homeErrorMessage(res));
  };

  const submit = (value: string) => {
    setError(null);
    actions.start(job.id, value, failed);
  };

  if (!entering) {
    return (
      <Button className={MAIN_BUTTON} disabled={pending} onClick={() => setEntering(true)}>
        <KeyRound aria-hidden /> Enter start code
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-surface-subtle p-3">
      <p id={`job-code-${job.id}`} className="text-center text-sm font-medium text-foreground">
        Ask the customer for their 4-digit code
      </p>
      <div className="flex justify-center">
        <InputOTP
          aria-labelledby={`job-code-${job.id}`}
          maxLength={CODE_LENGTH}
          inputMode="numeric"
          pattern={REGEXP_ONLY_DIGITS}
          autoComplete="off"
          autoFocus
          value={code}
          disabled={pending}
          onChange={setCode}
          onComplete={submit}
        >
          <InputOTPGroup>
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-14 text-2xl" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        {left} {left === 1 ? "try" : "tries"} left
      </p>
      <Button className={MAIN_BUTTON} disabled={pending || code.length < CODE_LENGTH} onClick={() => submit(code)}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} Start the visit
      </Button>
    </div>
  );
}
