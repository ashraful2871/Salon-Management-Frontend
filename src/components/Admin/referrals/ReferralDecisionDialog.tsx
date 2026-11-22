"use client";

import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { reasonText } from "@/components/Admin/users/labels";
import type { ApiResponse } from "@/lib/api-types";
import { approveReferral } from "@/services/referral/approveReferral";
import { rejectReferral } from "@/services/referral/rejectReferral";
import { APPROVE_REASONS, REJECT_REASONS } from "./labels";

export type Decision = { kind: "approve" | "reject"; id: string; who: string };

/**
 * Approve (release the held referrer reward) or reject (the referral, and any
 * held reward with it) with a reason on the audit log. Tier 3: the step-up
 * prompt comes up when the API asks for it, then the action retries once.
 */
export function ReferralDecisionDialog({
  decision,
  onClose,
  onDone,
}: {
  decision: Decision | null;
  onClose: () => void;
  onDone: (result: ApiResponse<unknown>, decision: Decision) => void;
}) {
  if (!decision) return null;
  const approve = decision.kind === "approve";
  const codes = approve ? APPROVE_REASONS : REJECT_REASONS;
  return (
    <ReasonDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={approve ? `Approve ${decision.who}'s reward` : `Reject this referral`}
      description={
        approve
          ? "The held referrer reward is released and the referrer is told they earned it. Its validity starts now."
          : "The referral is closed as rejected and any held reward on it is revoked. A welcome reward the friend already has stays."
      }
      reasonCodes={codes}
      confirmLabel={approve ? "Approve reward" : "Reject referral"}
      tone={approve ? "default" : "danger"}
      showNotify={false}
      stepUp
      onConfirm={(input) =>
        approve
          ? approveReferral(decision.id, reasonText(codes, input))
          : rejectReferral(decision.id, reasonText(codes, input))
      }
      onDone={(result) => onDone(result, decision)}
    />
  );
}
