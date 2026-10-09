import type { Tone } from "@/lib/status-tone";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AdminBookingFilters = {
  q?: string;
  status?: string;
  salonId?: string;
  area?: string;
  from?: string;
  to?: string;
  dateField?: string;
  channel?: string;
  source?: string;
  depositStatus?: string;
  appealStatus?: string;
  includeTest?: string;
  sort?: string;
  page?: number;
};

export type AdminBookingRow = {
  id: string;
  token: string | null;
  serialNumber: number | null;
  status: BookingStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string | null;
  totalMinor: number;
  depositMinor: number;
  depositStatus: string;
  bookedVia: "WEB" | "ASSISTANT" | "WALK_IN";
  source: "PLATFORM" | "SALON_DIRECT";
  appealStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  cancelledBy: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string; isTest: boolean };
  salon: { id: string; name: string; area: string | null; isTest: boolean };
  service: { id: string; name: string };
};

export type AdminBookingListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusCounts: Partial<Record<BookingStatus, number>>;
};

export type AdminTimelineEvent = {
  at: string;
  kind: string;
  title: string;
  detail?: string | null;
  tone?: Tone;
  actor?: string | null;
  amountMinor?: number;
};

export type AdminWalletTx = {
  id: string;
  type: string;
  amountMinor: number;
  balanceAfter: number;
  heldAfter: number;
  description: string;
  createdAt: string;
};

export type AdminLedgerRow = {
  id: string;
  account: string;
  amountMinor: number;
  description: string;
  payoutId: string | null;
  createdAt: string;
};

export type AdminBookingDetail = Omit<AdminBookingRow, "customer" | "salon" | "service"> & {
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  startedAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  noShowMarkedAt: string | null;
  appealedAt: string | null;
  appealReason: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    isTest: boolean;
    noShows: number;
    bookings: number;
  };
  salon: {
    id: string;
    name: string;
    area: string | null;
    status: string;
    isTest: boolean;
    phone: string | null;
    owner: { id: string; name: string; email: string; phone: string | null } | null;
  };
  service: { id: string; name: string; priceMinor: number };
  staff: { id: string; user: { name: string } | null } | null;
  counter: { id: string; name: string } | null;
  review: { id: string; rating: number; comment: string | null; createdAt: string } | null;
  timeline: AdminTimelineEvent[];
  money: {
    deposit: { amountMinor: number; status: string };
    payment: {
      id: string;
      amountMinor: number;
      paymentMethod: string;
      status: string;
      transactionId: string | null;
      paymentDate: string | null;
    } | null;
    walletTx: AdminWalletTx[];
    ledger: AdminLedgerRow[];
    ledgerSumMinor: number;
    balanced: boolean;
  };
};

export type AdminAppealRow = {
  id: string;
  token: string | null;
  serialNumber: number | null;
  status: BookingStatus;
  appointmentDate: string;
  startTime: string;
  depositMinor: number;
  depositStatus: string;
  noShowMarkedAt: string | null;
  appealedAt: string | null;
  appealReason: string | null;
  checkedInAt: string | null;
  dueAt: string | null;
  remindersSent: string[];
  salonNoShowRate90d: number | null;
  salonSettled90d: number;
  customerNoShows: number;
  customer: { id: string; name: string; email: string; isTest: boolean };
  salon: { id: string; name: string; area: string | null; isTest: boolean };
  service: { id: string; name: string };
};
