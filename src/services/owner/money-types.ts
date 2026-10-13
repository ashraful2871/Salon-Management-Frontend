import type { MonthlyEarnings } from "@/services/settlement/settlement-types";

/** Where a SALON_PAYABLE line sits (same split as the summary's buckets). */
export type MoneyBucket = "pending" | "available" | "in_payout" | "paid";

/** Mirrors `TRANSACTION_TYPES` in the backend's `Owner/owner.money.ts`. */
export const TRANSACTION_TYPES = [
  { value: "booking", label: "Bookings" },
  { value: "no_show", label: "No-shows" },
  { value: "late_cancel", label: "Late cancels" },
  { value: "commission", label: "Commission" },
  { value: "goodwill", label: "Goodwill" },
  { value: "dues", label: "Dues" },
  { value: "payout_adjustment", label: "Adjustments" },
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];

export type PayoutStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type BranchBuckets = {
  salonId: string | null;
  salonName: string;
  pendingMinor: number;
  availableMinor: number;
  inPayoutMinor: number;
  paidMinor: number;
  duesMinor: number;
};

export type OwnerMoneySummary = {
  holdDays: number;
  minMinor: number;
  nextPayoutDate: string;
  pendingMinor: number;
  availableMinor: number;
  inPayoutMinor: number;
  paidMinor: number;
  duesMinor: number;
  paidThisMonthMinor: number;
  perSalon: BranchBuckets[];
  lastPayout: {
    id: string;
    netMinor: number;
    status: PayoutStatus;
    createdAt: string;
    paidAt: string | null;
    destination: string | null;
    failureReason: string | null;
  } | null;
  account: {
    id: string;
    status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
    label: string;
    cooldownUntil: string | null;
  } | null;
  payoutsFrozen: boolean;
  commissionPercent: number;
  commissionOnDirect: boolean;
  monthly: MonthlyEarnings[];
};

export type OwnerTransaction = {
  id: string;
  createdAt: string;
  salonId: string | null;
  salonName: string;
  type: TransactionType;
  description: string;
  amountMinor: number;
  bucket: MoneyBucket;
  appointment: { id: string; token: string | null; serviceName: string | null } | null;
  payoutId: string | null;
};

export type OwnerPayout = {
  id: string;
  status: PayoutStatus;
  periodStart: string;
  periodEnd: string;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  method: string | null;
  reference: string | null;
  destination: string | null;
  failureReason: string | null;
  cancelledReason: string | null;
  paidAt: string | null;
  createdAt: string;
  /** null = a business-wide payout across branches. */
  salonName: string | null;
  entryCount: number;
};

export type OwnerPayoutDetail = OwnerPayout & {
  entriesTotalMinor: number;
  branches: {
    salonId: string | null;
    salonName: string;
    totalMinor: number;
    entries: OwnerTransaction[];
  }[];
};

export type CursorPage<T> = { items: T[]; nextCursor: string | null };

export type TransactionFilters = {
  salonId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
};

/** The query string the list and its CSV download share. */
export const transactionsQuery = (filters: TransactionFilters, cursor?: string) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  if (cursor) query.set("cursor", cursor);
  return query.toString();
};
