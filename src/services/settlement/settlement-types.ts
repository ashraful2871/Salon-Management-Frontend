/**
 * Mirrors `settlement.earnings.ts` on the backend.
 *
 * Every amount here is poisha under a `Minor` name. `addTakaFields` puts a
 * taka twin next to each one on the way out, but render from the `Minor`
 * field — `formatBDT` divides by 100 itself, so formatting a taka field shows
 * the amount 100x too small.
 */

export type MonthlyEarnings = {
  month: string;
  label: string;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  bookings: number;
};

export type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

export type Payout = {
  id: string;
  salonId: string;
  periodStart: string;
  periodEnd: string;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  status: PayoutStatus;
  method?: string | null;
  reference?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  salon?: { id: string; name: string };
};

export type SalonEarningsSummary = {
  grossBookingsMinor: number;
  commissionMinor: number;
  netEarningsMinor: number;
  depositsCollectedMinor: number;
  counterCollectedMinor: number;
  depositsHeldMinor: number;
  payableMinor: number;
  processingPayoutMinor: number;
  paidOutMinor: number;
  failedPayoutMinor: number;
  todayGrossMinor: number;
  monthGrossMinor: number;
  monthCommissionMinor: number;
  monthNetMinor: number;
  completedBookings: number;
  averageTicketMinor: number;
  effectiveCommissionPercent: number;
  standardCommissionPercent: number;
  monthly: MonthlyEarnings[];
};

export type EarningsBooking = {
  id: string;
  appointmentDate: string;
  startTime: string;
  totalMinor: number;
  depositMinor: number;
  depositStatus: string;
  source: "PLATFORM" | "SALON_DIRECT";
  commissionMinor: number;
  netMinor: number;
  customer?: { name: string };
  service?: { name: string };
  salon?: { id: string; name: string };
};

export type MyEarnings = {
  summary: SalonEarningsSummary;
  payouts: Payout[];
  balances: Array<{ salonId: string; payableMinor: number }>;
  salons: Array<{ id: string; name: string; payableMinor: number }>;
  recentBookings: EarningsBooking[];
};

export type PlatformEarnings = {
  grossBookingsMinor: number;
  platformRevenueMinor: number;
  monthRevenueMinor: number;
  todayRevenueMinor: number;
  salonPayableMinor: number;
  salonEarningsMinor: number;
  pendingPayoutMinor: number;
  pendingPayoutCount: number;
  paidOutMinor: number;
  paidPayoutCount: number;
  failedPayoutMinor: number;
  failedPayoutCount: number;
  walletFloatMinor: number;
  walletHeldMinor: number;
  depositsHeldMinor: number;
  forfeitedDepositMinor: number;
  forfeitedCount: number;
  topupVolumeMinor: number;
  topupCount: number;
  completedBookings: number;
  averageTicketMinor: number;
  effectiveCommissionPercent: number;
  standardCommissionPercent: number;
  monthly: MonthlyEarnings[];
};
