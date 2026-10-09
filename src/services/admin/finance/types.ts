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
  unbalanced: {
    appointmentId: string;
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

export type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

export type AdminPayout = {
  id: string;
  salonId: string;
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
  paidAt: string | null;
  createdAt: string;
  salon: { id: string; name: string; area: string; phone: string | null };
  markedPaidBy: { id: string; name: string | null } | null;
};

export type AdminPayouts = {
  statusCounts: Record<PayoutStatus, { count: number; netMinor: number }>;
  items: AdminPayout[];
};

export type PayoutPreview = {
  periodEnd: string;
  rows: {
    salonId: string;
    salonName: string;
    area: string | null;
    isTest: boolean;
    netMinor: number;
  }[];
  totals: { salons: number; netMinor: number };
};

export type PayoutRunResult = {
  periodStart: string;
  periodEnd: string;
  created: { payoutId: string; salonId: string; netMinor: number }[];
  skipped: { salonId: string; netMinor: number }[];
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
