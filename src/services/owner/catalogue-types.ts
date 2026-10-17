export type CopyServicesResult = {
  createdCount: number;
  skippedCount: number;
  branches: Array<{ salonId: string; salonName: string; created: string[]; skipped: string[] }>;
};

export type BulkPriceRow = {
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  beforeMinor: number;
  afterMinor: number;
};

export type BulkPriceResult = {
  dryRun: boolean;
  changed: number;
  unchanged: number;
  rows: BulkPriceRow[];
  /** Branches picked that have no service by that name. */
  missing: Array<{ salonId: string; salonName: string }>;
};

export type BulkPriceInput = {
  serviceName: string;
  salonIds: string[];
  priceMinor?: number;
  percentChange?: number;
};

export type CompletenessCheck =
  | "description"
  | "photos"
  | "hours"
  | "exactPin"
  | "services"
  | "team"
  | "phone"
  | "slots14d";

export type SalonCompleteness = {
  salonId: string;
  salonName: string;
  score: number;
  done: Record<CompletenessCheck, boolean>;
  missing: Array<{ key: CompletenessCheck; label: string; href: string }>;
};
