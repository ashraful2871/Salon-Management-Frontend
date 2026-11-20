/**
 * Shapes of `/referrals/*` and `/admin/referrals/*`. Money is poisha under
 * `<name>Minor`; `sendResponse` adds a taka twin next to each one (contract 2),
 * declared optional here and never rendered (`formatBDT` takes the poisha).
 */

/* ------------------------------------------------------------ errors */

/** `ApiResponse.errorCode` values the referral flows branch on. */
export type ReferralErrorCode =
  // Who
  | "CUSTOMER_ONLY"
  // Attach (sign-up)
  | "REFERRAL_PROGRAM_OFF"
  | "REFERRAL_CODE_INVALID"
  | "REFERRAL_SELF"
  | "REFERRAL_NOT_NEW_ACCOUNT"
  // Redeem (quote / book)
  | "REWARD_UNAVAILABLE"
  | "REWARD_NOT_APPLICABLE"
  | "PRICE_CHANGED";

/** `details.reason` of a `REWARD_NOT_APPLICABLE`. */
export type RewardNotApplicableReason =
  | "EXPIRED"
  | "SCOPE"
  | "MIN_ORDER"
  | "FIRST_BOOKING_DONE"
  | "TOO_SMALL"
  | "PHONE_REQUIRED"
  | "PHONE_REUSED"
  | "REDEMPTIONS_OFF";

/* ------------------------------------------------------------ enums */

export type RewardScope = "ALL" | "SALON" | "HOME";
export type RewardStatus = "PENDING_REVIEW" | "AVAILABLE" | "RESERVED" | "REDEEMED" | "EXPIRED" | "REVOKED";
export type RewardKind = "REFEREE_WELCOME" | "REFERRER_BONUS" | "MANUAL_GRANT";
export type ReferralStatus = "PENDING_VERIFICATION" | "JOINED" | "QUALIFIED" | "REJECTED" | "EXPIRED";
export type ReferrerTrigger = "FIRST_BOOKING_COMPLETED" | "REFEREE_VERIFIED";
export type ReferralChannel = "CODE" | "LINK";
/** How far a friend has got, for the referrer's list. */
export type FriendStep = "JOINED" | "BOOKED" | "COMPLETED" | "REWARDED" | "IN_REVIEW" | "NOT_ELIGIBLE";
export type RiskFlag =
  | "SAME_DEVICE"
  | "SAME_NETWORK"
  | "VELOCITY"
  | "DISPOSABLE_EMAIL"
  | "AUTO_CLOSED"
  | "PHONE_REUSED";
export type RewardSkip = "REFERRER_INELIGIBLE" | "CAP_MONTH" | "CAP_LIFETIME";

/* ------------------------------------------------------------ terms */

/** One side's terms, from the settings in force (not a reward's snapshot). */
export type ReferralSideTerms = {
  /** 5 for 5 %. */
  percent: number;
  /** 0 = no cap. */
  maxDiscountMinor: number;
  maxDiscount?: number;
  minOrderMinor: number;
  minOrder?: number;
  validDays: number;
  scope: RewardScope;
};

export type ReferralTerms = {
  friend: ReferralSideTerms;
  you: ReferralSideTerms & { trigger: ReferrerTrigger };
  /** 0 = no cap. */
  maxPerMonth: number;
  attributionDays: number;
};

/* ------------------------------------------------------------ customer */

/** `GET /referrals/code/:code`: the invite landing. Same shape for a valid and an invalid code. */
export type InviteLookup = {
  valid: boolean;
  /** The referrer's first name; null for an invalid code. */
  firstName: string | null;
  programOn: boolean;
  signedIn: boolean;
  terms: ReferralSideTerms;
};

/** `GET /referrals/me`: the Refer page. */
export type MyReferral = {
  code: string;
  link: string;
  programOn: boolean;
  /** A blocked code no longer works for new friends. */
  blocked: boolean;
  terms: ReferralTerms;
  stats: {
    joined: number;
    qualified: number;
    rewardsEarned: number;
    savedMinor: number;
    saved?: number;
    /** Referrer rewards since the 1st (Dhaka), what the monthly cap counts. */
    thisMonth: number;
  };
  /** The settings' share text, already filled in. */
  shareMessage: string;
};

/** `GET /referrals/me/friends`: one friend, name shortened ("Rahim K."). */
export type ReferralFriend = {
  id: string;
  name: string;
  joinedAt: string;
  status: ReferralStatus;
  step: FriendStep;
};

/** The booking a reward is held by or was spent on. */
export type RewardBookingRef = { kind: "SALON" | "HOME"; id: string; ref: string | null };

/** `GET /referrals/me/rewards`: one of my rewards, usable ones first. */
export type ReferralReward = {
  id: string;
  kind: RewardKind;
  label: string;
  percent: number;
  maxDiscountMinor: number;
  maxDiscount?: number;
  minOrderMinor: number;
  minOrder?: number;
  scope: RewardScope;
  firstBookingOnly: boolean;
  expiresAt: string;
  status: RewardStatus;
  /** What it took off a booking (0 until reserved). */
  discountMinor: number;
  discount?: number;
  booking: RewardBookingRef | null;
  /** "Welcome reward", "Rahim K. completed their first booking", … */
  source: string;
  createdAt: string;
};

/** `GET /referrals/me/rewards/summary`: the booking flow's teaser. */
export type RewardSummary = {
  available: number;
  /** Off: quotes apply no reward, so the teaser stays hidden. */
  redemptionsOn: boolean;
  best: {
    label: string;
    percent: number;
    maxDiscountMinor: number;
    maxDiscount?: number;
    scope: RewardScope;
    expiresAt: string;
  } | null;
};

/** A reward priced against one booking (`promo` and each of `rewardOptions` on a quote). */
export type PromoQuote = {
  rewardId: string;
  kind: RewardKind;
  label: string;
  percent: number;
  discountMinor: number;
  discount?: number;
  expiresAt: string;
};

/* ------------------------------------------------------------ admin */

export type AdminPerson = {
  id: string;
  name: string;
  /** Masked unless the admin holds `users.view_pii` (`meta.piiMasked`). */
  email: string;
  phone?: string | null;
  href: string;
};

/** `GET /admin/referrals/overview?from&to&includeTest`. */
export type AdminReferralOverview = {
  range: { from: string; to: string };
  includeTest: boolean;
  kpis: {
    attached: number;
    joined: number;
    qualified: number;
    conversionPercent: number;
    rewardsIssued: number;
    rewardsRedeemed: number;
    rewardsExpired: number;
    pendingReview: number;
    discountCostMinor: number;
    discountCost?: number;
    costPerQualifiedMinor: number;
    costPerQualified?: number;
    referredGmvMinor: number;
    referredGmv?: number;
  };
  funnel: Array<{
    key: "link_opens" | "signups" | "verified" | "first_booking" | "rewarded";
    label: string;
    count: number;
  }>;
  daily: Array<{ day: string; attached: number; qualified: number; costMinor: number; cost?: number }>;
  costByKind: Array<{ kind: RewardKind; costMinor: number; cost?: number }>;
  topReferrers: Array<{
    userId: string;
    name: string;
    href: string;
    qualified: number;
    rewards: number;
    costMinor: number;
    cost?: number;
  }>;
};

export type AdminReferralFilters = { from?: string; to?: string; includeTest?: boolean };

export type AdminReferralQuery = {
  status?: ReferralStatus;
  flagged?: boolean;
  q?: string;
  from?: string;
  to?: string;
  includeTest?: boolean;
  page?: number;
};

export type AdminRewardQuery = {
  kind?: RewardKind;
  status?: RewardStatus;
  q?: string;
  includeTest?: boolean;
  page?: number;
};

/** Admin lists send `{ page, limit, total, totalPages, piiMasked }`. */
export type AdminReferralMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  piiMasked: boolean;
};

/** `GET /admin/referrals`: one row. */
export type AdminReferralRow = {
  id: string;
  code: string;
  channel: ReferralChannel;
  status: ReferralStatus;
  riskFlags: RiskFlag[];
  heldForReview: boolean;
  referrerRewardSkip: RewardSkip | null;
  createdAt: string;
  joinedAt: string | null;
  qualifiedAt: string | null;
  isTest: boolean;
  referrer: AdminPerson;
  referee: AdminPerson;
  rewards: Array<{ id: string; kind: RewardKind; status: RewardStatus; percentBps: number; expiresAt: string; label: string }>;
  href: string;
};

/** A booking linked from a referral or a reward. `status: "MISSING"` when it is gone. */
export type AdminBookingRef = {
  kind: "SALON" | "HOME";
  id: string;
  reference: string | null;
  status: string;
  completedAt?: string | null;
  billableMinor?: number;
  billable?: number;
  promoDiscountMinor?: number;
  promoDiscount?: number;
  source?: string;
  salon?: { id: string; name: string };
  href: string | null;
};

/** One reward in the back office (detail, rewards list). */
export type AdminRewardView = {
  id: string;
  kind: RewardKind;
  label: string;
  status: RewardStatus;
  percent: number;
  percentBps: number;
  maxDiscountMinor: number;
  maxDiscount?: number;
  minOrderMinor: number;
  minOrder?: number;
  scope: RewardScope;
  firstBookingOnly: boolean;
  expiresAt: string;
  discountMinor: number;
  discount?: number;
  createdAt: string;
  reservedAt: string | null;
  redeemedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  expiredReason: string | null;
  grantReason: string | null;
  remindedAt: string | null;
  booking: AdminBookingRef | null;
};

export type AdminReferralPerson = AdminPerson & {
  role: string;
  status: string;
  emailVerified: boolean;
  isTest: boolean;
  isDeleted: boolean;
  joinedAt: string;
  code: string | null;
  codeBlocked: boolean;
  codeBlockedReason: string | null;
};

/** `GET /admin/referrals/:id`. */
export type AdminReferralDetail = {
  id: string;
  code: string;
  channel: ReferralChannel;
  status: ReferralStatus;
  isTest: boolean;
  createdAt: string;
  joinedAt: string | null;
  qualifiedAt: string | null;
  referrerRewardSkip: RewardSkip | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  rejectedReason: string | null;
  piiMasked: boolean;
  flags: Array<{ flag: RiskFlag; reason: string }>;
  referrer: AdminReferralPerson;
  referee: AdminReferralPerson;
  qualifyingBooking: AdminBookingRef | null;
  rewards: { welcome: AdminRewardView | null; referrer: AdminRewardView | null };
  canApprove: boolean;
  canReject: boolean;
  events: Array<{
    id: string;
    type: string;
    label: string;
    createdAt: string;
    rewardId: string | null;
    actor: { id: string; name: string | null } | null;
    data: unknown;
  }>;
};

/** `GET /admin/referrals/rewards`: one row. */
export type AdminRewardRow = AdminRewardView & {
  user: AdminPerson;
  referral: { id: string; code: string; href: string } | null;
  canRevoke: boolean;
};

/** `POST /admin/referrals/rewards/grant`. */
export type GrantRewardInput = {
  userId: string;
  /** 1–50. */
  percent: number;
  /** 0 = no cap. */
  maxDiscountMinor: number;
  validDays: number;
  scope: RewardScope;
  reason: string;
};
