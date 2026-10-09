"use client";

import { useState, useTransition } from "react";
import { Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { inboxAge } from "@/components/Admin/inbox";
import { useClock } from "@/components/Admin/useClock";
import { decideApproval } from "@/services/admin/approvals/decideApproval";
import type { AdminApproval } from "@/services/admin/approvals/types";

const ACTION_LABELS: Record<AdminApproval["action"], string> = {
  "wallet.adjust": "Wallet adjustment",
  "topup.refund": "Top-up refund",
  "payout.mark_paid": "Payout marked paid",
  "setting.update": "Money setting",
};

const REJECT_CODES = [
  { value: "WRONG_AMOUNT", label: "Wrong amount" },
  { value: "NOT_JUSTIFIED", label: "Reason doesn't justify it" },
  { value: "NEEDS_EVIDENCE", label: "Needs evidence first" },
  { value: "OTHER", label: "Other" },
];

/**
 * One four-eyes request: what, who asked, why, how long ago. Approve runs the
 * money move (step-up); Reject needs a note. The requester's own cards show
 * "Waiting" - nobody approves their own request.
 */
export function ApprovalCard({ approval }: { approval: AdminApproval }) {
  const now = useClock();
  const [rejecting, setRejecting] = useState(false);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const approve = () =>
    startTransition(async () => {
      const result = await run(() => decideApproval(approval.id, "approve"));
      if (result.success) toast.success("Approved and done");
      else toast.error(result.message, { duration: 10_000 });
    });

  const age =
    now === null
      ? null
      : inboxAge({ key: approval.id, count: 1, oldestAt: approval.createdAt, tone: "warning", href: "" }, now);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {ACTION_LABELS[approval.action] ?? approval.action}
          </p>
          <h2 className="mt-0.5 font-medium">{approval.summary}</h2>
        </div>
        <ToneBadge status={approval.status}>{humanizeStatus(approval.status)}</ToneBadge>
      </div>
      <p className="mt-2 text-sm">
        <span className="text-muted-foreground">Reason: </span>
        {approval.reason}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {approval.mine ? "You" : (approval.requestedBy?.name ?? "An admin")} asked · {formatDhaka(approval.createdAt)}
        {approval.status === "PENDING" && age ? ` · ${age.replace("Oldest ", "")} ago` : ""}
        {approval.status === "PENDING" && ` · expires ${formatDhaka(approval.expiresAt)}`}
      </p>
      {approval.decidedBy && (
        <p className="mt-1 text-xs text-muted-foreground">
          {humanizeStatus(approval.status)} by {approval.decidedBy.name}
          {approval.decidedAt ? ` · ${formatDhaka(approval.decidedAt)}` : ""}
          {approval.decisionNote ? ` · "${approval.decisionNote}"` : ""}
        </p>
      )}
      {approval.error && (
        <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{approval.error}</p>
      )}

      {approval.status === "PENDING" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {approval.mine ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden /> Waiting for another admin
              </span>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(true)} disabled={pending}>
                Withdraw
              </Button>
            </>
          ) : approval.canDecide ? (
            <>
              <Button size="sm" onClick={approve} disabled={pending}>
                <Check className="size-4" aria-hidden />
                {pending ? "Approving…" : "Approve"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setRejecting(true)} disabled={pending}>
                <X className="size-4" aria-hidden />
                Reject
              </Button>
            </>
          ) : null}
        </div>
      )}

      <ReasonDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={approval.mine ? "Withdraw request" : "Reject request"}
        description={approval.summary}
        reasonCodes={approval.mine ? [{ value: "OTHER", label: "Withdrawn by me" }] : REJECT_CODES}
        confirmLabel={approval.mine ? "Withdraw" : "Reject"}
        tone="danger"
        showNotify={false}
        onConfirm={({ reasonCode, note }) => {
          const label = REJECT_CODES.find((c) => c.value === reasonCode)?.label;
          const text = approval.mine ? note || "Withdrawn" : reasonCode === "OTHER" ? note : note ? `${label}: ${note}` : label;
          return decideApproval(approval.id, "reject", text);
        }}
        onDone={() => toast.success(approval.mine ? "Request withdrawn" : "Request rejected")}
      />
      {dialog}
    </article>
  );
}
