export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errorDetails?: Record<string, string[]>;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  /** Appointment list only: totals per status under every filter but `status`. */
  statusCounts?: Partial<Record<AppointmentStatus, number>>;
};

export type OperatingHour = {
  open: string;
  close: string;
};

export type OperatingHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    OperatingHour
  >
>;

export type SalonStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export type LocationAccuracy = "EXACT" | "APPROXIMATE";

export type Salon = {
  id: string;
  name: string;
  description?: string | null;
  phone?: string;
  email?: string;
  website?: string;
  address?: string | null;
  division?: string;
  district?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  images?: string[];
  operatingHours?: OperatingHours;
  status?: SalonStatus;
  rating?: number;
  totalReviews?: number;
  services?: SalonService[];
  staff?: StaffMember[];
  reviews?: Review[];
  _count?: {
    services: number;
    staff: number;
    reviews: number;
  };
  depositMinor?: number;
  cancellationWindowMin?: number;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: LocationAccuracy | null;
  locationUpdatedAt?: string | null;
  // Only present in nearby mode (lat/lng in the query).
  distanceMeters?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SalonMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locationAccuracy: LocationAccuracy | null;
  rating: number;
  totalReviews: number;
  image: string | null;
  minPriceMinor: number | null;
};

// GET /salons/map. `truncated`: more than 200 salons in the box.
export type SalonMarkersResult = {
  markers: SalonMarker[];
  truncated: boolean;
};

// [minLng, minLat, maxLng, maxLat], the order GET /salons/map expects.
export type Bbox = [west: number, south: number, east: number, north: number];

export type GeoPlace = {
  label: string;
  lat: number;
  lng: number;
  area?: string;
  district?: string;
  division?: string;
  city?: string;
  postcode?: string;
};

export type SalonService = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  priceMinor?: number | null;
  duration?: number | null;
  images?: string[];
  isActive?: boolean;
  salonId?: string;
  salon?: { name: string };
  createdAt?: string;
  updatedAt?: string;
};

export type StaffMember = {
  id: string;
  speciality?: string;
  experience?: number;
  bio?: string;
  status?: "AVAILABLE" | "BUSY" | "OFF";
  designation?: string;
  salonId?: string;
  user?: {
    name: string;
    email: string;
    profilePhoto?: string;
  };
};

export type Appointment = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    duration?: number;
    priceMinor?: number;
  };
  salon?: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    user?: { name: string };
  };
  counter?: {
    name: string;
    code?: string;
  };
  token?: string | null;
  serialNumber?: number | null;
  // Billing. The server computes everything from `depositPaidMinor` down, so
  // the owner and the customer always read the same numbers.
  totalMinor: number;
  depositMinor: number;
  depositStatus: string;
  depositPaidMinor: number;
  paidAtCounterMinor: number;
  amountDueMinor: number;
  paymentState: PaymentState;
  checkedInAt?: string | null;
  completedAt?: string | null;
  payment?: {
    amountMinor: number;
    paymentMethod: CounterPaymentMethod | string;
    status: string;
    paymentDate?: string | null;
  } | null;
  review?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

// Whether the bill is settled, independent of the booking status.
export type PaymentState =
  | "UNPAID"
  | "PAID"
  | "UNRECORDED"
  | "REFUNDED"
  | "NOT_APPLICABLE";

// How the balance is taken at the counter.
export type CounterPaymentMethod = "CASH" | "CARD" | "MOBILE_BANKING";

export type CheckoutReceipt = {
  appointmentId: string;
  token?: string | null;
  serialNumber?: number | null;
  serviceName: string;
  counterName?: string | null;
  customerName: string;
  totalMinor: number;
  depositPaidMinor: number;
  collectedMinor: number;
  paymentMethod?: CounterPaymentMethod | null;
  completedAt: string;
};

export type CashSummary = {
  countsByStatus: Partial<Record<AppointmentStatus, number>>;
  collectedMinor: number;
  // Poisha per method.
  collectedByMethod: Record<CounterPaymentMethod, number>;
  outstandingMinor: number;
  expectedMinor: number;
  unrecordedCount: number;
  depositsAppliedMinor: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  role: string;
  status?: string;
  profilePhoto?: string;
  createdAt?: string;
};

export type Review = {
  id: string;
  rating: number;
  comment?: string;
  user?: { name: string };
  createdAt?: string;
};

/**
 * The union of what the three `/dashboard-stats/*` endpoints return — every
 * field is optional because each role gets its own subset.
 *
 * Money is poisha under `<name>Minor`. `addTakaFields` puts a taka twin next to
 * each one, and those twins are deliberately left out of this type: `formatBDT`
 * divides by 100 itself, so rendering the twin shows the amount 100x too small.
 */
export type DashboardStats = {
  // Counts
  totalUsers?: number;
  totalCustomers?: number;
  totalSalonOwners?: number;
  totalStaff?: number;
  totalAgents?: number;
  totalSalons?: number;
  activeSalons?: number;
  pendingSalons?: number;
  totalServices?: number;
  totalAppointments?: number;
  todayAppointments?: number;
  pendingAppointments?: number;
  completedAppointments?: number;
  cancelledAppointments?: number;
  noShowAppointments?: number;
  upcomingAppointments?: number;

  // Money, in poisha
  totalRevenueMinor?: number;
  grossBookingsMinor?: number;
  commissionMinor?: number;
  netEarningsMinor?: number;
  salonEarningsMinor?: number;
  salonPayableMinor?: number;
  payableMinor?: number;
  monthRevenueMinor?: number;
  monthCommissionMinor?: number;
  monthNetMinor?: number;
  todayRevenueMinor?: number;
  depositsCollectedMinor?: number;
  counterCollectedMinor?: number;
  depositsHeldMinor?: number;
  depositsPaidMinor?: number;
  forfeitedDepositMinor?: number;
  processingPayoutMinor?: number;
  pendingPayoutMinor?: number;
  pendingPayoutCount?: number;
  paidOutMinor?: number;
  failedPayoutMinor?: number;
  walletFloatMinor?: number;
  walletBalanceMinor?: number;
  walletAvailableMinor?: number;
  walletHeldMinor?: number;
  walletFrozen?: boolean;
  topupVolumeMinor?: number;
  totalSpentMinor?: number;
  averageTicketMinor?: number;
  averageSpendMinor?: number;

  // The one commission rate in force, as a percentage, plus what was
  // actually charged over everything billed.
  effectiveCommissionPercent?: number;
  standardCommissionPercent?: number;

  monthlyEarnings?: Array<{
    month: string;
    label: string;
    grossMinor: number;
    commissionMinor: number;
    netMinor: number;
    bookings: number;
  }>;

  salons?: Array<{ id: string; name: string }>;
  recentAppointments?: Appointment[];
  recentPayouts?: Array<{
    id: string;
    netMinor: number;
    status: string;
    periodStart?: string;
    periodEnd?: string;
    salon?: { id: string; name: string };
  }>;
  usersByRole?: Array<{ role: string; _count: number }>;
  salonsByStatus?: Array<{ status: string; _count: number }>;
  appointmentsByStatus?: Array<{
    status: string;
    _count: number;
  }>;
};

export type SalonApplication = {
  id: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  documentUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user?: { name: string; email: string };
  createdAt?: string;
};

export type ApplicationStatusType = "PENDING" | "APPROVED" | "REJECTED";

export type ApplicationData = {
  id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  verificationStatus: boolean;
  documentUrl: string;
  applicationStatus: ApplicationStatusType;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type SalonQuery = {
  division?: string;
  district?: string;
  area?: string;
  searchTerm?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: "distance" | "rating" | "newest";
  page?: number;
  limit?: number;
};
