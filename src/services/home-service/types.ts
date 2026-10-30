// Home Service ("Hire an Expert") shapes, as the API's `/home-service/*` and
// `/admin/home-service/*` replies send them. Dates are ISO strings.
//
// Money is poisha under `<name>Minor`; `sendResponse` adds a taka twin next to
// each, which is left out here on purpose: `formatBDT` takes poisha, so
// rendering a twin would show the amount 100x too small.

import type { SalonAudience } from "@/lib/api-types";

// ---------------------------------------------------------------- unions

export type HomeAudience = "LADIES" | "GENTS";

export type HomeBookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "EXPIRED";

/** Statuses that hold the expert's time and count toward the customer's limit. */
export const ACTIVE_HOME_STATUSES: readonly HomeBookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
];

export type HomeCancelPolicy = "FREE" | "WINDOW" | "NON_REFUNDABLE";

export type HomeServiceStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export type ExpertVerification = "DRAFT" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export type ExpertGender = "MALE" | "FEMALE";

export type HomeCategory =
  | "FACIAL"
  | "THREADING"
  | "WAXING"
  | "MAKEUP"
  | "MEHEDI"
  | "HAIR"
  | "MANICURE_PEDICURE"
  | "BRIDAL"
  | "MASSAGE"
  | "HAIRCUT"
  | "BEARD"
  | "GROOMING"
  | "OTHER";

export type AdvanceStatus = "PENDING" | "HELD" | "APPLIED" | "RELEASED" | "PARTIALLY_FORFEITED" | "FORFEITED";

export type BalanceMethod = "CASH" | "BKASH_TO_SALON" | "WALLET" | "NOT_COLLECTED";

export type HomeCancelledBy = "CUSTOMER" | "SALON" | "ADMIN" | "SYSTEM";

export type HomeNoShowParty = "CUSTOMER" | "EXPERT";

export type HomeAppealStatus = "PENDING" | "APPROVED" | "REJECTED";

export type HomeSafetyKind = "SAFETY" | "QUALITY" | "MISMATCH" | "HARASSMENT" | "OTHER";

export type HomeReportStatus = "OPEN" | "REVIEWING" | "ACTIONED" | "DISMISSED";

export type HomeDocKind = "ID_FRONT" | "ID_BACK" | "SELFIE";

export type HomePayMethod = "WALLET" | "BKASH" | "SSLCOMMERZ";

export type SlotPeriod = "MORNING" | "AFTERNOON" | "EVENING";

/** Every `errorCode` the Home Service endpoints answer with (plus the shared ones they reuse). */
export type HomeErrorCode =
  // Who
  | "HOME_SERVICE_CUSTOMER_ONLY"
  | "ACCOUNT_NOT_ACTIVE"
  | "PHONE_REQUIRED"
  | "OWN_SALON"
  | "PAYMENT_PENDING_EXISTS"
  | "TOO_MANY_ACTIVE"
  | "HOME_SERVICE_BLOCKED"
  // What
  | "INVALID_CART"
  | "AUDIENCE_MIXED"
  | "HOME_SERVICE_UNAVAILABLE"
  | "SALON_UNAVAILABLE"
  | "BELOW_MIN_ORDER"
  | "VISIT_TOO_LONG"
  // Expert
  | "EXPERT_UNAVAILABLE"
  | "EXPERT_GENDER_MISMATCH"
  | "EXPERT_CANNOT_DO_SERVICE"
  | "NO_EXPERT_FREE"
  // When
  | "OUTSIDE_BOOKING_WINDOW"
  | "TOO_SOON"
  | "INVALID_TIME"
  | "SLOT_TAKEN"
  // Where
  | "INVALID_LOCATION"
  | "OUT_OF_SERVICE_AREA"
  | "RECIPIENT_CONFIRMATION_REQUIRED"
  // Money and actions
  | "PRICE_CHANGED"
  | "POLICY_NOT_ACCEPTED"
  | "POLICY_CHANGED"
  | "WALLET_FROZEN"
  | "PAYMENT_EXPIRED"
  | "INVALID_STATE"
  | "RESCHEDULE_NOT_ALLOWED"
  | "START_CODE_INVALID"
  | "START_CODE_LOCKED"
  | "ALREADY_REVIEWED"
  | "HOME_SERVICE_OFF_CHECKLIST"
  | "TOO_MANY_REPORTS"
  // Shared (contract 8)
  | "IMPERSONATION_READ_ONLY"
  | "STEP_UP_REQUIRED"
  | "APPROVAL_REQUIRED";

// ---------------------------------------------------------------- policy

/** A booking's `policySnapshot` and the policy part of a quote. */
export type HomePolicy = {
  policy: HomeCancelPolicy;
  /** Changes whenever any policy or disclaimer setting is saved. */
  version: number;
  freeCancelHours: number;
  lateCancelPercent: number;
  noShowPercent: number;
  nonRefundableGraceMinutes: number;
  salonCancelCreditMinor: number;
  feeSalonSharePercent: number;
  appealWindowHours: number;
  maxRescheduleCount: number;
};

/** The admin's per-policy disclaimer text; "" = use the generated one. */
export type HomeDisclaimerOverrides = Record<HomeCancelPolicy, string>;

/** `policy` on the public expert detail: what is in force now, plus the admin's text for it. */
export type HomePolicyInForce = {
  customerCancelPolicy: HomeCancelPolicy;
  freeCancelHours: number;
  lateCancelPercent: number;
  noShowPercent: number;
  nonRefundableGraceMinutes: number;
  advancePercent: number;
};

/** What an end returns (`decideOutcome`). */
export type HomeOutcome = {
  feeMinor: number;
  feePercent: number;
  refundMinor: number;
  salonShareMinor: number;
  platformShareMinor: number;
  salonCreditMinor: number;
  reasonCode: string;
};

// ---------------------------------------------------------------- public reads

export type HomeCatalogOffering = {
  name: string;
  category: HomeCategory;
  minPriceMinor: number;
  durationMin: number;
  image: string | null;
  salonCount: number;
  /** Verified experts who offer it within reach. */
  expertCount: number;
};

/** `GET /home-service/catalog?audience&lat&lng` */
export type HomeCatalog = {
  audience: HomeAudience;
  outOfArea: boolean;
  /** Distinct experts who reach this point (what the unfiltered experts list totals). */
  expertCount: number;
  /** `count` = services in the category, `expertCount` = distinct experts offering one of them. */
  categories: Array<{ category: HomeCategory; count: number; expertCount: number; minPriceMinor: number }>;
  offerings: HomeCatalogOffering[];
};

export type HomeExpertSort = "rating" | "distance" | "soonest";

/** One card of `GET /home-service/experts`. */
export type HomeExpertCard = {
  id: string;
  name: string;
  photo: string | null;
  headline: string | null;
  languages: string[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  verified: true;
  salon: { id: string; name: string; area: string | null };
  distanceKm: number;
  fromPriceMinor: number;
  /** Only with `sort=soonest`. */
  soonestAt?: string | null;
  soonestLabel?: string | null;
};

export type HomeExpertList = {
  audience: HomeAudience;
  outOfArea: boolean;
  sort: HomeExpertSort;
  experts: HomeExpertCard[];
};

export type HomeExpertQuery = {
  audience: HomeAudience;
  lat: number;
  lng: number;
  category?: HomeCategory;
  sort?: HomeExpertSort;
  page?: number;
};

export type HomeMenuItem = {
  id: string;
  category: HomeCategory;
  name: string;
  description: string | null;
  kitNote: string | null;
  durationMin: number;
  priceMinor: number;
  images: string[];
};

export type HomeReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  customer: { name: string; photo: string | null };
  services: string[];
};

export type HomeReviewPage = {
  meta: { page: number; limit: number; total: number; totalPages: number };
  items: HomeReview[];
};

/** `GET /home-service/experts/:id` */
export type HomeExpertDetail = {
  id: string;
  audience: HomeAudience;
  name: string;
  photo: string | null;
  headline: string | null;
  bio: string | null;
  speciality: string | null;
  experienceYears: number | null;
  languages: string[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  verified: true;
  salon: {
    id: string;
    name: string;
    area: string | null;
    city: string | null;
    image: string | null;
    rating: number;
    totalReviews: number;
    travelFeeMinor: number;
    minOrderMinor: number;
  };
  menu: HomeMenuItem[];
  /** null without a location in the query. */
  distanceKm: number | null;
  servesYou: boolean | null;
  policy: HomePolicyInForce & { disclaimer: string };
  reviews: HomeReviewPage;
};

export type HomeSlot = {
  startAt: string;
  label: string;
  period: SlotPeriod;
  /** Only when asking by salon ("any expert"): who is free then. */
  expertIds?: string[];
};

/** `GET /home-service/availability` */
export type HomeAvailability = { date: string; outOfArea: boolean; slots: HomeSlot[] };

export type HomeDay = { date: string; label: string; hasSlots: boolean };

/** `GET /home-service/availability/days` */
export type HomeDays = { outOfArea: boolean; days: HomeDay[] };

/** Pass `expertId`, or `salonId` for "any expert of the branch". */
export type HomeAvailabilityQuery = {
  offeringIds: string[];
  expertId?: string;
  salonId?: string;
  lat?: number;
  lng?: number;
};

// ---------------------------------------------------------------- customer booking

export type HomeExpertSummary = {
  id: string;
  name: string;
  photo: string | null;
  audience: HomeAudience;
  headline: string | null;
  languages: string[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
};

/** The body of `POST /bookings/quote`; create adds the quote's hash and the acceptance. */
export type HomeQuoteInput = {
  salonId: string;
  audience: HomeAudience;
  offeringIds: string[];
  /** "ANY" = any free expert of the branch. */
  expertId: string | "ANY";
  /** YYYY-MM-DD, Asia/Dhaka. */
  date: string;
  startAt: string;
  lat: number;
  lng: number;
  addressLine: string;
  area?: string;
  landmark?: string;
  recipientName: string;
  /** Required on a Ladies visit booked for someone else. */
  recipientIsWoman?: boolean;
  contactPhone: string;
  notes?: string;
};

export type HomeCreateInput = HomeQuoteInput & {
  quoteHash: string;
  policyAccepted: boolean;
  policyVersion: number;
  lang?: "en" | "bn";
};

/** `POST /bookings/quote` */
export type HomeQuote = {
  salon: { id: string; name: string };
  audience: HomeAudience;
  expertId: string | "ANY";
  expert: HomeExpertSummary | null;
  date: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  distanceKm: number;
  items: Array<{ id: string; name: string; durationMin: number; priceMinor: number }>;
  subtotalMinor: number;
  travelFeeMinor: number;
  totalMinor: number;
  advancePercent: number;
  advanceMinor: number;
  balanceMinor: number;
  policy: HomePolicy;
  policyVersion: number;
  disclaimer: { en: string; bn: string };
  requiresAcceptance: boolean;
  paymentWindowMinutes: number;
  quoteHash: string;
};

/** A row of `GET /bookings/me`. */
export type HomeBookingSummary = {
  id: string;
  code: string;
  status: HomeBookingStatus;
  audience: HomeAudience;
  startAt: string;
  endAt: string;
  /** Only while PENDING_PAYMENT. */
  expiresAt: string | null;
  totalMinor: number;
  advanceMinor: number;
  balanceMinor: number;
  advanceStatus: AdvanceStatus;
  createdAt: string;
  salon: { id: string; name: string; area: string | null; image: string | null };
  expert: HomeExpertSummary;
  services: string[];
};

export type HomeTimelineEvent = {
  fromStatus: HomeBookingStatus | null;
  toStatus: HomeBookingStatus;
  actorRole: string;
  reason: string | null;
  createdAt: string;
};

/** `GET /bookings/:id` (the customer's own). */
export type HomeBooking = HomeBookingSummary & {
  serviceDate: string;
  address: {
    addressLine: string;
    area: string | null;
    landmark: string | null;
    latitude: number;
    longitude: number;
    distanceKm: number;
  };
  recipientName: string;
  recipientIsWoman: boolean | null;
  contactPhone: string;
  notes: string | null;
  subtotalMinor: number;
  travelFeeMinor: number;
  advancePercent: number;
  items: Array<{ offeringId: string; name: string; priceMinor: number; durationMin: number }>;
  policy: HomePolicy;
  disclaimerText: string;
  policyAcceptedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: HomeCancelledBy | null;
  cancelReason: string | null;
  noShowParty: HomeNoShowParty | null;
  feeMinor: number;
  refundedMinor: number | null;
  rescheduleCount: number;
  appealStatus: HomeAppealStatus | null;
  appealedAt: string | null;
  timeline: HomeTimelineEvent[];
  /** The 4 digits the customer reads to the expert; null outside CONFIRMED … ARRIVED. */
  startCode: string | null;
  balanceMethod: BalanceMethod | null;
  balanceHeldInApp: boolean;
};

export type HomeMyBookingsTab = "upcoming" | "past";

/** `POST /bookings/:id/pay`: confirmed from the wallet, or a gateway page to go to. */
export type HomePayResult =
  | { status: Exclude<HomeBookingStatus, "PENDING_PAYMENT">; paidFrom: "WALLET" | null; booking: HomeBooking }
  | {
      status: "PENDING_PAYMENT";
      paidFrom: "BKASH" | "SSLCOMMERZ";
      redirectUrl: string;
      transactionId: string;
      amountMinor: number;
      shortfallMinor: number;
    };

/** `GET /bookings/:id/cancel-quote` */
export type HomeCancelQuote = {
  canCancel: boolean;
  outcome: HomeOutcome;
  advanceMinor: number;
  /** A balance paid in the app that comes back too. */
  balanceBackMinor: number;
  message: string;
  canReschedule: boolean;
  rescheduleBlockedReason: string | null;
  policy: HomeCancelPolicy;
};

/** What every end (cancel, no-show, abort) replies with. */
export type HomeEndResult = {
  bookingId: string;
  code: string;
  status: HomeBookingStatus;
  outcome: HomeOutcome;
  balanceReleasedMinor: number;
};

export type HomeRescheduleInput = {
  date: string;
  startAt: string;
  /** Omitted = the same expert; "ANY" = any free expert of the branch. */
  expertId?: string | "ANY";
};

export type HomeSafetyReportInput = { kind: HomeSafetyKind; details: string };

export type HomeSafetyReportReceipt = {
  id: string;
  kind: HomeSafetyKind;
  status: HomeReportStatus;
  createdAt: string;
};

/** `POST /bookings/:id/help`: an URGENT ticket, reused for 15 minutes. */
export type HomeHelpResult = {
  ticketNumber: number;
  reportId: string;
  supportPhone: string;
  reused: boolean;
};

export type HomeReviewInput = { rating: number; comment?: string };

export type HomeAddress = {
  id: string;
  label: string;
  addressLine: string;
  area: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HomeAddressInput = {
  label: string;
  addressLine: string;
  area?: string | null;
  landmark?: string | null;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
};

// ---------------------------------------------------------------- expert: my jobs

/** A visit as its expert sees it. Address and phone open 2 h before the start. */
export type HomeJob = {
  id: string;
  code: string;
  status: HomeBookingStatus;
  audience: HomeAudience;
  startAt: string;
  endAt: string;
  area: string | null;
  salon: { id: string; name: string };
  services: Array<{ name: string; durationMin: number }>;
  recipientFirstName: string;
  /** What to collect at the door: 0 once paid in the app. */
  balanceMinor: number;
  balancePaidInApp: boolean;
  startCodeTriesLeft: number;
  canSetOffFrom: string;
  addressRevealAt: string;
  address: {
    addressLine: string;
    landmark: string | null;
    latitude: number;
    longitude: number;
    notes: string | null;
  } | null;
  contactPhone: string | null;
};

/** `GET /jobs?date` */
export type HomeJobList = { from: string; to: string; jobs: HomeJob[] };

export type HomeJobCompleteInput = {
  balanceMethod: BalanceMethod;
  collectedMinor: number;
  note?: string;
};

export type HomeAbortKind = "MISMATCH" | "SAFETY";

// ---------------------------------------------------------------- owner

export type HomeChecklistItem = { key: string; ok: boolean; hint: string };

export type HomeServiceProfile = {
  /** null until the branch first saves or turns on (`exists: false`). */
  id: string | null;
  exists?: boolean;
  salonId: string;
  isOn: boolean;
  ladiesEnabled: boolean;
  gentsEnabled: boolean;
  status: HomeServiceStatus;
  everApproved: boolean;
  pausedUntil: string | null;
  pauseReason: string | null;
  suspendedReason: string | null;
  radiusKm: number;
  travelFeeMinor: number;
  minOrderMinor: number;
  travelBufferMin: number;
  dayStart: string;
  dayEnd: string;
  statusReason?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** The platform caps a branch's own settings live inside. */
export type HomePlatformCaps = {
  enabled: boolean;
  ladiesEnabled: boolean;
  gentsEnabled: boolean;
  maxRadiusKm: number;
  travelFeeMaxMinor: number;
  minOrderMinMinor: number;
  minOrderMaxMinor: number;
  dayStartBound: string;
  dayEndBound: string;
  ladiesLastStart: string;
};

/** `GET /home-service/owner/profile?salonId` */
export type OwnerHomeProfile = {
  salon: { id: string; name: string; audience: SalonAudience; status: string };
  profile: HomeServiceProfile;
  allowedSides: HomeAudience[];
  checklist: HomeChecklistItem[];
  platform: HomePlatformCaps;
  policyInForce: HomePolicyInForce;
  bookable: Record<HomeAudience, boolean>;
  /** Turn on / off / pause are the business owner's alone. */
  canSwitch: boolean;
};

export type HomeTurnOnInput = { salonId: string; ladies: boolean; gents: boolean; reason?: string };

export type HomeTurnOffInput = { salonId: string; upcoming: "KEEP" | "CANCEL"; reason?: string };

export type HomeTurnOffResult = HomeServiceProfile & {
  /** Only with `upcoming: "CANCEL"`. */
  cancelled?: number;
  refundedMinor?: number;
  notCancelled?: number;
  underWay?: number;
};

export type HomePauseInput = { salonId: string; until?: string; reason?: string };

export type HomeProfileSettingsInput = {
  salonId: string;
  radiusKm?: number;
  travelFeeMinor?: number;
  minOrderMinor?: number;
  travelBufferMin?: number;
  dayStart?: string;
  dayEnd?: string;
};

export type HomeOffering = {
  id: string;
  salonId: string;
  audience: HomeAudience;
  category: HomeCategory;
  name: string;
  description: string | null;
  kitNote: string | null;
  durationMin: number;
  priceMinor: number;
  images: string[];
  isActive: boolean;
  isDeleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type HomeOfferingInput = {
  category: HomeCategory;
  name: string;
  description?: string | null;
  kitNote?: string | null;
  /** A multiple of 15, 15–480. */
  durationMin: number;
  priceMinor: number;
  images?: string[];
  sortOrder?: number;
};

export type HomeOfferingCreateInput = HomeOfferingInput & {
  salonId: string;
  audience: HomeAudience;
  isActive?: boolean;
};

export type HomeExpertDocs = Record<"idFront" | "idBack" | "selfie", boolean>;

/** An expert as the owner and the admin see it (never the document ids). */
export type HomeExpertRow = {
  id: string;
  staffId: string;
  salonId: string;
  gender: ExpertGender;
  audience: HomeAudience;
  verification: ExpertVerification;
  submittedAt: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  headline: string | null;
  languages: string[];
  maxJobsPerDay: number;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  cancelledBySalon: number;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
  docs: HomeExpertDocs;
  offeringIds?: string[];
};

export type OwnerHomeExpert = HomeExpertRow & {
  staff: { name: string; photo: string | null; active: boolean };
};

export type HomeExpertCandidate = {
  staffId: string;
  name: string;
  photo: string | null;
  gender: string | null;
  speciality: string | null;
};

export type HomeExpertCreateInput = { salonId: string; staffId: string; gender: ExpertGender };

export type HomeExpertUpdateInput = {
  headline?: string | null;
  languages?: string[];
  maxJobsPerDay?: number;
  isActive?: boolean;
  gender?: ExpertGender;
};

/** A signed upload ticket for a private Cloudinary document (10 minutes). */
export type HomeDocSignature = {
  kind: HomeDocKind;
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  params: {
    public_id: string;
    timestamp: number;
    upload_preset: string;
    type: "authenticated";
    tags: string;
    signature: string;
  };
  expiresAt: string;
};

export type HomeDocSaveInput = { kind: HomeDocKind; publicId: string; bytes: number };

export type HomeExpertRemoveResult = {
  id: string;
  /** Upcoming visits moved to another expert, else cancelled (salon at fault). */
  upcoming: { reassigned: number; cancelled: number; refundedMinor: number; failed: string[]; underWay: number };
};

/** A row of the owner's bookings board (the address shows at any time). */
export type OwnerHomeBooking = {
  id: string;
  code: string;
  status: HomeBookingStatus;
  audience: HomeAudience;
  startAt: string;
  endAt: string;
  salon: { id: string; name: string };
  expert: { id: string; name: string; audience: HomeAudience };
  customerName: string;
  recipientName: string;
  contactPhone: string;
  address: { addressLine: string; area: string | null; landmark: string | null; latitude: number; longitude: number };
  notes: string | null;
  services: Array<{ name: string; durationMin: number }>;
  subtotalMinor: number;
  travelFeeMinor: number;
  totalMinor: number;
  advanceMinor: number;
  advanceStatus: AdvanceStatus;
  balanceMinor: number;
  balanceMethod: BalanceMethod | null;
  balanceCollectedMinor: number | null;
  startCodeTries: number;
  createdAt: string;
};

export type OwnerHomeBookingQuery = {
  salonId?: string;
  status?: HomeBookingStatus;
  audience?: HomeAudience;
  expertId?: string;
  from?: string;
  to?: string;
  page?: number;
};

// ---------------------------------------------------------------- admin

export type AdminHomeProfileRow = HomeServiceProfile & {
  id: string;
  salon: {
    id: string;
    name: string;
    audience: SalonAudience;
    status: string;
    area: string | null;
    district: string | null;
    isTest: boolean;
  };
  owner: { id: string; name: string; email: string } | null;
  sides: { ladies: boolean; gents: boolean };
  checklist: HomeChecklistItem[];
  /** Expert counts per side and verification state. */
  experts: Record<HomeAudience, Partial<Record<ExpertVerification, number>>>;
};

export type AdminHomeExpertRow = HomeExpertRow & {
  salon: { id: string; name: string; audience: SalonAudience };
  staff: { name: string; photo: string | null; userGender: string | null };
};

/** `GET /admin/home-service/experts/:id/documents`: audited, 5-minute links. */
export type AdminHomeExpertDocuments = {
  expert: AdminHomeExpertRow;
  declaredGender: ExpertGender;
  documents: Record<HomeDocKind, { url: string; format: string } | null>;
  expiresAt: string;
};

/** A row of `GET /admin/home-service/bookings`. */
export type AdminHomeBookingRow = {
  id: string;
  code: string;
  status: HomeBookingStatus;
  audience: HomeAudience;
  startAt: string;
  endAt: string;
  area: string | null;
  totalMinor: number;
  advanceMinor: number;
  advanceStatus: AdvanceStatus;
  feeMinor: number;
  refundedMinor: number | null;
  cancelledBy: HomeCancelledBy | null;
  noShowParty: HomeNoShowParty | null;
  appealStatus: HomeAppealStatus | null;
  isTest: boolean;
  createdAt: string;
  salon: { id: string; name: string };
  customer: { id: string; name: string; email: string };
  expert: { id: string; name: string };
  services: string[];
};

export type AdminHomeBookingQuery = {
  status?: HomeBookingStatus;
  audience?: HomeAudience;
  salonId?: string;
  /** HS-code, booking id, email, phone or name. */
  q?: string;
  from?: string;
  to?: string;
  page?: number;
};

/** `GET /admin/home-service/bookings/:id` */
export type AdminHomeBooking = AdminHomeBookingRow & {
  serviceDate: string;
  expiresAt: string | null;
  addressLine: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  recipientName: string;
  recipientIsWoman: boolean | null;
  contactPhone: string;
  notes: string | null;
  subtotalMinor: number;
  travelFeeMinor: number;
  advancePercent: number;
  balanceMinor: number;
  balanceMethod: BalanceMethod | null;
  balanceCollectedMinor: number | null;
  commissionBps: number;
  policySnapshot: HomePolicy;
  disclaimerText: string;
  policyAcceptedAt: string | null;
  paymentIntentId: string | null;
  startCodeTries: number;
  confirmedAt: string | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  noShowMarkedAt: string | null;
  appealedAt: string | null;
  appealReason: string | null;
  appealResolvedAt: string | null;
  rescheduleCount: number;
  customer: { id: string; name: string; email: string; phone: string | null };
  items: Array<{ offeringId: string; name: string; priceMinor: number; durationMin: number }>;
  events: HomeTimelineEvent[];
  safetyReports: Array<{ id: string; kind: HomeSafetyKind; status: HomeReportStatus; reporterRole: string; createdAt: string }>;
  ledgerEntries: Array<{ id: string; journalId: string; account: string; amountMinor: number; description: string; createdAt: string }>;
  /** Every journal sums to 0, so anything else is a bug worth flagging. */
  ledgerSumMinor: number;
};

export type AdminHomeReport = {
  id: string;
  reporterId: string;
  reporterRole: "CUSTOMER" | "EXPERT";
  kind: HomeSafetyKind;
  details: string;
  status: HomeReportStatus;
  handledById: string | null;
  handledAt: string | null;
  handlerNote: string | null;
  supportTicketId: string | null;
  ticketNumber: number | null;
  createdAt: string;
  booking: {
    id: string;
    code: string;
    status: HomeBookingStatus;
    audience: HomeAudience;
    startAt: string;
    area: string | null;
    salon: { id: string; name: string };
    customer: { id: string; name: string };
    expert: { id: string; name: string };
  };
  customerBlockedUntil: string | null;
};

export type AdminHomeReportStatusInput = {
  status: HomeReportStatus;
  note: string;
  blockCustomer?: { days: number };
};

/** A row of `GET /admin/appeals?kind=HOME`. */
export type AdminHomeAppeal = {
  kind: "HOME";
  id: string;
  code: string;
  status: HomeBookingStatus;
  audience: HomeAudience;
  startAt: string;
  advanceMinor: number;
  feeMinor: number;
  cancelledBy: HomeCancelledBy | null;
  cancelReason: string | null;
  noShowParty: HomeNoShowParty | null;
  noShowMarkedAt: string | null;
  arrivedAt: string | null;
  appealedAt: string | null;
  appealReason: string | null;
  isTest: boolean;
  customer: { id: string; name: string; isTest: boolean };
  salon: { id: string; name: string; area: string | null; isTest: boolean };
  services: string[];
  /** Decided within 48 h of the appeal. */
  dueAt: string | null;
};

/** Pagination as the admin queues send it. */
export type HomePageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  /** Safety reports only. */
  statusCounts?: Partial<Record<HomeReportStatus, number>>;
};
