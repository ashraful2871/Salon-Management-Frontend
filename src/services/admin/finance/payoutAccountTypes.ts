import type {
  KycStatus,
  OwnerKyc,
  PayoutAccount,
  PayoutAccountStatus,
} from "@/services/owner/payoutAccountTypes";

export type { KycStatus, PayoutAccountStatus };

/** The business behind an account, with its KYC (Finance only). */
export type AdminPayoutOwner = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  isTest: boolean;
  payoutsFrozen: boolean;
  kyc: OwnerKyc;
};

export type AdminPayoutAccount = PayoutAccount & {
  owner: AdminPayoutOwner;
  /** The VERIFIED account this one would replace, if any. */
  replaces: PayoutAccount | null;
};

export type AdminPayoutAccounts = {
  statusCounts: Record<PayoutAccountStatus, number>;
  kycSubmitted: number;
  items: AdminPayoutAccount[];
};

export type AdminKycRow = AdminPayoutOwner & {
  submittedAt: string;
  account: PayoutAccount | null;
};
