import type { PlatformEarnings } from "@/services/settlement/settlement-types";

/**
 * Mirrors `Admin/finance/*` on the backend. Amounts are poisha under `Minor`
 * names; render them with `formatBDT`, never the taka twin.
 */

/** A four-eyes route answers 202 with this instead of doing the work. */
export type ApprovalRequired = { status: "APPROVAL_REQUIRED"; approvalId: string };

export const isApprovalRequired = (data: unknown): data is ApprovalRequired =>
  !!data &&
  typeof data === "object" &&
  (data as { status?: unknown }).status === "APPROVAL_REQUIRED";

export type ReconciliationCounts = {
  unbalancedCount: number;
  driftCount: number;
  stuckIntents: number;
  lastReconcileAt: string | null;
};

export type FinanceOverview = {
  range: { from?: string; to?: string };
  earnings: PlatformEarnings;
  reconciliation: ReconciliationCounts;
};

export type Reconciliation = ReconciliationCounts & {
  /** One row per journal that does not sum to zero; appointmentId is null for non-booking journals. */
  unbalanced: {
    journalId: string;
    appointmentId: string | null;
    token: string | null;
    salonName: string | null;
    appointmentDate: string | null;
    totalMinor: number;
  }[];
  drift: {
    walletId: string;
    userId: string;
    name: string | null;
    email: string | null;
    balanceMinor: number;
    ledgerBalanceMinor: number;
    heldBalanceMinor: number;
    diffMinor: number;
  }[];
};

export type PayoutStatus = "PENDING" | "APPROVED" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";

/** One payout per business; salonId/salon are null when it spans several branches. */
export type AdminPayout = {
  id: string;
  ownerId: string;
  businessName: string | null;
  salonId: string | null;
  periodStart: string;
  periodEnd: string;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  status: PayoutStatus;
  method: string | null;
  reference: string | null;
  proofUrl: string | null;
  failureReason: string | null;
  cancelledReason: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  salon: { id: string; name: string; area: string; phone: string | null } | null;
  markedPaidBy: { id: string; name: string | null } | null;
  /** Where the batch said it goes; never the full number. Null on payouts raised before Phase 3. */
  destinationSnapshot: PayoutDestination | null;
};

export type PayoutDestination = {
  type: "BKASH" | "NAGAD" | "BANK";
  accountName: string;
  last4: string;
  bankName: string | null;
  routingNumber: string | null;
};

/** One row of a bulk payout call (`/admin/finance/payouts/approve`, `/mark-paid`). */
export type PayoutItemResult =
  | { payoutId: string; ok: true; status: PayoutStatus | "APPROVAL_REQUIRED"; approvalId?: string }
  | { payoutId: string; ok: false; error: string; code: number };

export type MarkPaidItem = { payoutId: string; reference: string; method: "BKASH" | "BANK"; proofUrl?: string };

export type AdminPayouts = {
  statusCounts: Record<PayoutStatus, { count: number; netMinor: number }>;
  items: AdminPayout[];
};

export type PayoutSkipReason = "below minimum" | "dues";

/** One row per business (all its branches netted); salonId only when it has one. */
export type PayoutPreviewRow = {
  ownerId: string;
  businessName: string;
  salonId: string | null;
  salonName: string;
  salons: number;
  area: string | null;
  isTest: boolean;
  netMinor: number;
};

export type PayoutPreview = {
  periodEnd: string;
  holdDays: number;
  minMinor: number;
  rows: PayoutPreviewRow[];
  skipped: (PayoutPreviewRow & { reason: PayoutSkipReason })[];
  totals: { salons: number; netMinor: number };
};

export type PayoutRunResult = {
  periodStart: string | null;
  periodEnd: string;
  created: { payoutId: string; ownerId: string; businessName: string; salonId: string | null; netMinor: number }[];
  skipped: { ownerId: string; businessName: string; salonId: string | null; netMinor: number; reason: PayoutSkipReason }[];
};

export type WalletCard = {
  balanceMinor: number;
  heldMinor: number;
  availableMinor: number;
  isFrozen: boolean;
  exists: boolean;
};

export type WalletHit = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isTest: boolean;
  wallet: WalletCard;
};

export type WalletTransaction = {
  id: string;
  type: string;
  amountMinor: number;
  balanceAfterMinor: number;
  heldAfterMinor: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type WalletDetail = {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    isTest: boolean;
  };
  wallet: WalletCard;
  /** The caller's own wallet: adjust and freeze are refused. */
  self: boolean;
  transactions: WalletTransaction[];
};

export const LEDGER_ACCOUNTS = [
  "SALON_PAYABLE",
  "PLATFORM_REVENUE",
  "CUSTOMER_WALLET",
  "GATEWAY_CLEARING",
] as const;
export type LedgerAccount = (typeof LEDGER_ACCOUNTS)[number];

export type LedgerEntry = {
  id: string;
  account: LedgerAccount;
  amountMinor: number;
  description: string;
  createdAt: string;
  salonId: string | null;
  appointmentId: string | null;
  payoutId: string | null;
  salon: { id: string; name: string } | null;
  appointment: { id: string; token: string | null } | null;
};

export type LedgerPage = { items: LedgerEntry[]; nextCursor: string | null };
