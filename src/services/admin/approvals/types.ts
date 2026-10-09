/** Mirrors `Admin/approvals/approvals.service.ts`. */
export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "EXECUTED"
  | "FAILED";

export type ApprovalAction =
  | "wallet.adjust"
  | "topup.refund"
  | "payout.mark_paid"
  | "setting.update";

type Person = { id: string; name: string; email: string } | null;

export type AdminApproval = {
  id: string;
  action: ApprovalAction;
  summary: string;
  reason: string;
  status: ApprovalStatus;
  payload: Record<string, unknown>;
  requestedBy: Person;
  decidedBy: Person;
  decidedAt: string | null;
  decisionNote: string | null;
  executedAt: string | null;
  error: string | null;
  expiresAt: string;
  createdAt: string;
  /** Requested by the caller: shown as "Waiting", never decidable. */
  mine: boolean;
  canDecide: boolean;
};

export type AdminApprovals = {
  enabled: boolean;
  pendingCount: number;
  items: AdminApproval[];
};
