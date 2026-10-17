import type { AnalyticsKpi } from "@/services/admin/analytics/types";

/** `GET /owner/reports/:report` (owner Phase 12). Money in poisha; days are Dhaka days. */

export const OWNER_REPORTS = [
  "overview",
  "bookings",
  "services",
  "team",
  "customers",
  "utilisation",
  "discovery",
  "money",
] as const;
export type OwnerReportName = (typeof OWNER_REPORTS)[number];

export type ReportKpi = AnalyticsKpi;

/** A figure we do not track: said plainly, never drawn as zeros. */
export type Unavailable = { available: false; reason: string };

export type OverviewReport = {
  kpis: ReportKpi[];
  revenue: { counterMinor: number; platformMinor: number; totalMinor: number };
  cancelled: number;
  reviews: number;
  series: Array<{ day: string; bookings: number; completed: number; counter: number; platform: number; revenue: number }>;
  previousSeries?: Array<{ day: string; revenue: number }>;
};

export type BookingsReport = {
  kpis: ReportKpi[];
  statuses: string[];
  perDay: Array<{ day: string; total: number } & Record<string, number | string>>;
  heatmap: { rows: string[]; grid: number[][] };
  leadTime: Array<{ key: string; label: string; value: number }>;
  channels: Array<{ key: string; value: number }>;
  cancellationReasons: Array<{ reason: string; n: number }>;
};

export type ServicesReport = {
  rows: Array<{
    name: string;
    category: string;
    branches: number;
    bookings: number;
    completed: number;
    revenueMinor: number;
    avgPriceMinor: number;
    share: number | null;
  }>;
  neverBooked: Array<{ serviceId: string; name: string; salonName: string; priceMinor: number }>;
};

export type TeamRow = {
  staffId: string | null;
  name: string;
  salonId: string;
  salonName: string;
  bookings: number;
  completed: number;
  noShows: number;
  revenueMinor: number;
  avgTicketMinor: number;
  rating: number | null;
  reviews: number;
  bookedMinutes: number;
  availableMinutes: number | null;
  utilisation: number | null;
};

export type TeamReport = {
  totals: { bookings: number; completed: number; noShows: number; revenueMinor: number; avgTicketMinor: number; utilisation: number | null };
  rows: TeamRow[];
  rowCount: number;
};

export type CustomersReport = {
  kpis: ReportKpi[];
  weekly: Array<{ week: string; fresh: number; returning: number }>;
  retention60:
    | Unavailable
    | { available: true; cohort: number; retained: number; percent: number | null; cohortTo: string };
  lapsed: Array<{ customerId: string; name: string; visits: number; spentMinor: number; lastBooking: string }>;
  top: Array<{ customerId: string; name: string; visits: number; spentMinor: number }>;
};

type StaffUse = { name: string; salonName: string; bookedMinutes: number; availableMinutes: number | null; utilisation: number | null };

export type UtilisationReport =
  | (Unavailable & { staff: TeamRow[] })
  | {
      available: true;
      kpis: ReportKpi[];
      perDay: Array<{ day: string; offered: number; booked: number; fill: number | null }>;
      perCounter: Array<{ counterId: string | null; name: string; salonName: string; offered: number; booked: number; fill: number | null }>;
      perHour: Array<{ hour: number; offered: number; booked: number; fill: number | null }>;
      emptyHours: number[];
      staff: StaffUse[];
    };

export type FunnelStep = { key: string; label: string } & ({ available: true; value: number } | Unavailable);

export type DiscoveryReport = {
  funnel: FunnelStep[];
  viewsSeries: Array<{ day: string; value: number }> | null;
  aiMatch: Unavailable;
  missedDemand:
    | Unavailable
    | { available: true; scope: string; note: string; terms: Array<{ term: string; searches: number; zero: number }> };
  sources: Array<{ key: string; value: number }>;
};

export type MoneyReport = {
  kpis: ReportKpi[];
  revenueMinor: number;
  counterByMethod: Array<{ key: string; valueMinor: number; payments: number }>;
  platformByType: Array<{ key: string; valueMinor: number }>;
  payouts: Array<{ payoutId: string; paidAt: string; amountMinor: number }>;
  /** Daily closes in the range (Phase 14); absent from an older API. */
  closes?: Array<{
    id: string;
    day: string;
    salonId: string;
    salonName: string;
    expectedCashMinor: number;
    countedCashMinor: number;
    differenceMinor: number;
  }>;
  closeDifferenceMinor?: number;
  series: Array<{ day: string; counter: number; platform: number }>;
};

export type ReportData = {
  overview: OverviewReport;
  bookings: BookingsReport;
  services: ServicesReport;
  team: TeamReport;
  customers: CustomersReport;
  utilisation: UtilisationReport;
  discovery: DiscoveryReport;
  money: MoneyReport;
};

export type OwnerReport<R extends OwnerReportName> = {
  report: R;
  from: string;
  to: string;
  compare: { from: string; to: string } | null;
  salonId: string | null;
  branches: number;
  tookMs: number;
  /** Null when no branch is in scope. */
  data: ReportData[R] | null;
};
