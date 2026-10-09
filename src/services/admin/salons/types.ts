import type { LocationAccuracy } from "@/lib/api-types";
import type { AdminActivityRow, AdminListMeta } from "../users/types";

export type { AdminActivityRow };

export type AdminSalonStatus = "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";

/** `meta` of `GET /admin/salons`: the usual paging plus a count per status. */
export type AdminSalonListMeta = AdminListMeta & {
  statusCounts?: Partial<Record<AdminSalonStatus, number>>;
};

export type AdminSalonFilters = {
  q?: string;
  status?: string;
  division?: string;
  district?: string;
  area?: string;
  location?: string;
  minRating?: string;
  from?: string;
  to?: string;
  includeTest?: string;
  sort?: string;
  page?: number;
};

/** A list row; enough for the review sheet's checklist without another request. */
export type AdminSalonRow = {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  imageCount: number;
  address: string;
  phone: string;
  area: string;
  district: string;
  division: string;
  status: AdminSalonStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  approvedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: LocationAccuracy | null;
  hasHours: boolean;
  rating: number;
  totalReviews: number;
  isTest: boolean;
  createdAt: string;
  services: number;
  pricedServices: number;
  bookings30d: number;
  /** Email always masked in lists. */
  owner: { id: string; name: string; email: string } | null;
};

export type AdminSalonDetail = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  address: string;
  area: string;
  district: string;
  division: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: LocationAccuracy | null;
  locationUpdatedAt: string | null;
  phone: string;
  email: string | null;
  images: string[];
  operatingHours: Record<string, unknown> | null;
  status: AdminSalonStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  approvedAt: string | null;
  rating: number;
  totalReviews: number;
  isTest: boolean;
  depositMinor: number;
  depositPercent: number | null;
  cancellationWindowMin: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    businessName: string | null;
    applicationStatus: string;
    user: { id: string; name: string; status: string; email: string; phone: string | null };
  };
  piiMasked: boolean;
  counts: {
    services: number;
    staff: number;
    counters: number;
    bookings30d: number;
    /** Share of the last 30 days' settled bookings that were no-shows; null with none. */
    noShowRate30d: number | null;
  };
  /** Only with finance.view. */
  balance: { payableMinor: number } | null;
  index: { hasEmbedding: boolean; embeddingModel: string | null; embeddedAt: string | null; stale: boolean };
  statusHistory: {
    id: string;
    action: string;
    actorName: string | null;
    actorRole: string;
    reason: string | null;
    createdAt: string;
  }[];
};

export type AdminSalonService = {
  id: string;
  name: string;
  category: string;
  priceMinor: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  _count: { appointments: number };
};

export type AdminSalonTeam = {
  staff: {
    id: string;
    speciality: string | null;
    status: string;
    rating: number;
    totalReviews: number;
    createdAt: string;
    user: { id: string; name: string; email: string; profilePhoto: string | null };
  }[];
  counters: { id: string; name: string; code: string | null; isActive: boolean }[];
};

export type AdminSalonBooking = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalMinor: number;
  depositMinor: number;
  depositStatus: string;
  createdAt: string;
  customer: { id: string; name: string };
  service: { id: string; name: string };
};

export type AdminSalonReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  appointmentId: string;
  customer: { id: string; name: string };
};

export type AdminSalonMoney = {
  balance: { payableMinor: number };
  payouts: {
    id: string;
    periodStart: string;
    periodEnd: string;
    netMinor: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  entries: {
    id: string;
    account: string;
    amountMinor: number;
    description: string;
    appointmentId: string | null;
    payoutId: string | null;
    createdAt: string;
  }[];
};

export type SalonImpact = {
  upcomingBookings: number;
  heldDepositsMinor: number;
  payableMinor: number;
};

/** The statuses an admin can set; PENDING_APPROVAL comes only from the owner. */
export type SalonStatusAction = "ACTIVE" | "REJECTED" | "SUSPENDED" | "INACTIVE";

export type SalonStatusInput = {
  status: SalonStatusAction;
  reasonCode?: string;
  note?: string;
  notify: boolean;
};

export type SalonStatusResult = {
  id: string;
  status: AdminSalonStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  approvedAt: string | null;
};
