export type PayoutAccountType = "BKASH" | "NAGAD" | "BANK";
export type PayoutAccountStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "DISABLED";
export type KycStatus = "NONE" | "SUBMITTED" | "VERIFIED" | "REJECTED";

/** A payout account as the API sends it: the number is always masked. */
export type PayoutAccount = {
  id: string;
  type: PayoutAccountType;
  accountName: string;
  /** "01•••••4821" for wallets, "•••• 4821" for banks. */
  number: string;
  last4: string;
  bankName: string | null;
  branchName: string | null;
  routingNumber: string | null;
  status: PayoutAccountStatus;
  cooldownUntil: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type OwnerKyc = {
  legalName: string | null;
  tradeLicenseNo: string | null;
  tin: string | null;
  bin: string | null;
  nidLast4: string | null;
  status: KycStatus;
  note: string | null;
};

export type PayoutSettings = {
  accounts: PayoutAccount[];
  /** Where the code goes, masked. */
  codeEmail: string;
  /** The owner has 2FA on: adding an account also needs the app's code. */
  totpRequired: boolean;
  cooldownHours: number;
  payoutsFrozen: boolean;
  kyc: OwnerKyc;
};

export type AddPayoutAccountInput =
  | {
      type: "BKASH" | "NAGAD";
      accountName: string;
      walletNumber: string;
      code: string;
      totp?: string;
    }
  | {
      type: "BANK";
      accountName: string;
      bankName: string;
      branchName: string;
      routingNumber: string;
      accountNumber: string;
      code: string;
      totp?: string;
    };

export type KycInput = {
  legalName: string;
  tradeLicenseNo: string;
  tin?: string;
  bin?: string;
  nidLast4: string;
};

export const ACCOUNT_TYPE_LABEL: Record<PayoutAccountType, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank account",
};
