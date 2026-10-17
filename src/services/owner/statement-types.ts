/** Mirrors `StatementKind` and the totals built in the backend's `Owner/owner.statements.ts`. */
export type StatementKind = "MONTHLY" | "PAYOUT" | "INVOICE";

export type OwnerStatementItem = {
  id: string;
  kind: StatementKind;
  /** INVOICE only: SK-2026-000123. */
  number: string | null;
  title: string;
  periodStart: string;
  /** Exclusive: the instant after the period. */
  periodEnd: string;
  payoutId: string | null;
  /** Closing balance (month), amount paid (payout) or invoice total. */
  amountMinor: number;
  createdAt: string;
};

/** The month's movements on the business's balance; opening + movements = closing. */
export type MonthlyTotals = {
  month: string;
  openingMinor: number;
  depositsAppliedMinor: number;
  noShowShareMinor: number;
  lateCancelMinor: number;
  prepaidMinor: number;
  commissionMinor: number;
  goodwillMinor: number;
  duesPaidMinor: number;
  payoutsMinor: number;
  adjustmentsMinor: number;
  closingMinor: number;
  /** Paid at the counter in the month; not part of the balance. */
  counterCollectedMinor: number;
  entryCount: number;
  payoutIds: string[];
  perSalon: {
    salonId: string | null;
    salonName: string;
    netMinor: number;
    depositsAppliedMinor: number;
    noShowShareMinor: number;
    lateCancelMinor: number;
    commissionMinor: number;
    goodwillMinor: number;
    duesPaidMinor: number;
    adjustmentsMinor: number;
  }[];
};

export type PayoutTotals = {
  reference: string;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  depositsAppliedMinor: number;
  noShowShareMinor: number;
  lateCancelMinor: number;
  goodwillMinor: number;
  duesPaidMinor: number;
  adjustmentsMinor: number;
  method: string | null;
  bankReference: string | null;
  destination: string | null;
  paidAt: string | null;
  entryCount: number;
  perSalon: { salonId: string | null; salonName: string; entryCount: number; netMinor: number }[];
};

export type InvoiceTotals = {
  month: string;
  seller: { legalName: string; bin: string | null };
  buyer: {
    businessName: string;
    legalName: string | null;
    address: string | null;
    bin: string | null;
    tin: string | null;
  };
  lines: { salonId: string | null; salonName: string; bookings: number; commissionMinor: number }[];
  subtotalMinor: number;
  vatRatePercent: number;
  /** Included in the subtotal, never added on top. */
  vatMinor: number;
  netOfVatMinor: number;
  totalMinor: number;
  entryCount: number;
};

export type OwnerStatementDetail = OwnerStatementItem & {
  totals: MonthlyTotals | PayoutTotals | InvoiceTotals;
  ledgerHash: string;
  platform: { legalName: string; bin: string | null };
  owner: {
    businessName: string;
    legalName: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    bin: string | null;
    tin: string | null;
  };
};
