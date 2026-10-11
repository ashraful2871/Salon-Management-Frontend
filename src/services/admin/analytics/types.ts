/** `/admin/analytics/*` shapes (Phase 10). Money stays in poisha (`unit: "minor"`). */

export type MetricUnit = "count" | "minor" | "percent" | "hours" | "days";

export type AnalyticsReportName =
  | "overview"
  | "bookings"
  | "customers"
  | "salons"
  | "geo"
  | "funnel"
  | "search"
  | "assistant"
  | "tryon";

export type AnalyticsKpi = {
  id: string;
  label: string;
  value: number | null;
  /** Present when `compare=prev`. */
  previous?: number | null;
  unit: MetricUnit;
  goodDirection: "up" | "down";
  /** The metric can't be narrowed by area/channel, so the filter didn't apply. */
  filtersIgnored?: boolean;
};

export type SeriesPoint = { day: string; value: number | null };

export type Breakdown = Array<{ key: string; value: number }>;

export type CohortRow = { cohort: string; size: number; months: Array<number | null> };

export type AreaRow = {
  area: string;
  district: string;
  listed: number;
  created: number;
  completed: number;
  gmvMinor: number;
};

export type SalonMoneyRow = {
  salonId: string;
  name: string;
  area: string;
  gmvMinor: number;
  completed: number;
};

export type FunnelStep = { id: string; label: string; value: number; fromPrevious: number | null };

export type SearchTerm = { term: string; surface: string; count: number; zero: number };

export type AssistantLive = {
  window: { days: number; from: string; to: string; timeZone: string };
  daily: Array<{ date: string; conversations: number; bookings: number }>;
  totals: { conversations: number; bookings: number };
  funnel: {
    conversations: number;
    reachedSummary: number;
    booked: number;
    stoppedAt: Record<string, number>;
  };
  avgTurnsToBook: number | null;
  topProblems: Array<{ outcome: string; count: number }>;
  outcomes: {
    last14Days: Record<string, number>;
    sinceRestart: Record<string, number>;
    countingSince: string;
  };
};

/** `tables` per report; every key is optional so a backend change degrades to an empty card. */
export type AnalyticsTables = {
  byChannel?: Breakdown;
  bySource?: Breakdown;
  cancelledBy?: Breakdown;
  cohorts?: CohortRow[];
  signupsByRole?: Breakdown;
  topSalons?: SalonMoneyRow[];
  areas?: AreaRow[];
  steps?: FunnelStep[];
  pages?: Breakdown;
  referrers?: Breakdown;
  surfaces?: Breakdown;
  terms?: { top: SearchTerm[]; zeroResults: SearchTerm[] };
  aiTiers?: Breakdown;
  assistantLive?: AssistantLive;
  failures?: Breakdown;
};

export type AnalyticsReport = {
  report: AnalyticsReportName;
  range: {
    from: string;
    to: string;
    timeZone: string;
    previous?: { from: string; to: string };
  };
  filters: { includeTest: boolean; area: string | null; channel: string | null };
  kpis: AnalyticsKpi[];
  series: Record<string, SeriesPoint[]>;
  tables: AnalyticsTables;
  /** When the API produced this (the cached response's `Date` header). */
  fetchedAt?: string;
};

export type MetricDefinition = {
  id: string;
  label: string;
  definition: string;
  unit: MetricUnit;
  goodDirection: "up" | "down";
  kind: string;
};

export type AnalyticsQuery = {
  from: string;
  to: string;
  compare: "prev" | "none";
  area?: string;
  channel?: string;
  includeTest?: boolean;
};
