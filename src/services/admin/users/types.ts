export type AccountRole = "CUSTOMER" | "STAFF" | "SALON_OWNER" | "ADMIN" | "AGENT";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLOCKED" | "DELETED";

/** `meta` of the `/admin/*` lists. */
export type AdminListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Users list only: totals per role under every filter but `role`. */
  roleCounts?: Partial<Record<AccountRole, number>>;
};

export type AdminUserFilters = {
  q?: string;
  role?: string;
  status?: string;
  verified?: string;
  from?: string;
  to?: string;
  hasBookings?: string;
  provider?: string;
  includeTest?: string;
  sort?: string;
  page?: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  /** Always masked in lists. */
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  role: AccountRole;
  status: AccountStatus;
  emailVerified: boolean;
  isTest: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  suspendedUntil: string | null;
  bookings: number;
  walletBalanceMinor: number;
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  /** True when the viewer lacks users.view_pii: contact fields are masked. */
  piiMasked: boolean;
  profilePhoto: string | null;
  role: AccountRole;
  status: AccountStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  suspendedUntil: string | null;
  lastActiveAt: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  isTest: boolean;
  createdAt: string;
  signInMethods: {
    password: boolean;
    identities: { provider: string; createdAt: string; lastUsedAt: string | null }[];
  };
  /** Admins and agents only. */
  mfa: { enabled: boolean; enabledAt: string | null } | null;
  adminRole: string | null;
  agentArea: { division: string; district: string; area: string } | null;
  ownerApplication: string | null;
  ownedSalons: { id: string; name: string; status: string; area: string; district: string }[];
  worksAt: { id: string; name: string; status: string } | null;
  counts: {
    bookings: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    noShow: number;
    reviews: number;
  };
  wallet: { balanceMinor: number; heldMinor: number; isFrozen: boolean } | null;
};

export type AdminUserBooking = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string | null;
  status: string;
  totalMinor: number;
  depositMinor: number;
  depositStatus: string;
  createdAt: string;
  salon: { id: string; name: string };
  service: { id: string; name: string };
};

export type AdminWalletTransaction = {
  id: string;
  type: string;
  amountMinor: number;
  balanceAfterMinor: number;
  heldAfterMinor: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type AdminUserWallet = {
  wallet: { balanceMinor: number; heldMinor: number; isFrozen: boolean; currency: string } | null;
  transactions: AdminWalletTransaction[];
};

export type AdminUserReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  appointmentId: string;
  salon: { id: string; name: string };
};

export type AdminActivityRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  actorRole: string;
  actorName: string | null;
  source: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
};

export type UserImpact = {
  upcomingBookings: number;
  heldDepositsMinor: number;
  ownedSalons: number;
  salons: { id: string; name: string; status: string }[];
};

export type UserStatusInput = {
  status: "ACTIVE" | "SUSPENDED" | "BLOCKED";
  until?: string;
  reasonCode: string;
  note?: string;
  notify: boolean;
  cancelUpcoming?: boolean;
  suspendSalons?: boolean;
};

export type UserStatusResult = {
  id: string;
  status: AccountStatus;
  statusReason: string;
  suspendedUntil: string | null;
  cancelledBookings: number;
  cancelFailed: number;
  inactivatedSalons: number;
};
