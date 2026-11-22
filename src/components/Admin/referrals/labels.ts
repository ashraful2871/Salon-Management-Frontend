import type { ReasonCode } from "@/components/Admin/ReasonDialog";
import { formatBDT } from "@/lib/money";
import type {
  AdminBookingRef,
  ReferralChannel,
  ReferralStatus,
  RewardKind,
  RewardScope,
  RewardSkip,
  RewardStatus,
  RiskFlag,
} from "@/services/referral/types";

/** Words for the back office's referral screens; statuses are coloured by `status-tone.ts`. */

export const REFERRAL_STATUSES: ReferralStatus[] = ["PENDING_VERIFICATION", "JOINED", "QUALIFIED", "REJECTED", "EXPIRED"];

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  PENDING_VERIFICATION: "Not verified",
  JOINED: "Joined",
  QUALIFIED: "Qualified",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const REWARD_STATUSES: RewardStatus[] = ["PENDING_REVIEW", "AVAILABLE", "RESERVED", "REDEEMED", "EXPIRED", "REVOKED"];

export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  PENDING_REVIEW: "Held for review",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  REDEEMED: "Redeemed",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
};

export const REWARD_KINDS: RewardKind[] = ["REFEREE_WELCOME", "REFERRER_BONUS", "MANUAL_GRANT"];

export const KIND_LABELS: Record<RewardKind, string> = {
  REFEREE_WELCOME: "Friend's welcome",
  REFERRER_BONUS: "Referrer reward",
  MANUAL_GRANT: "Granted by admin",
};

export const SCOPE_LABELS: Record<RewardScope, string> = {
  ALL: "Salons + Home",
  SALON: "Salons only",
  HOME: "Home only",
};

export const CHANNEL_LABELS: Record<ReferralChannel, string> = { LINK: "Link", CODE: "Code" };

/** Risk flags in plain English, short enough for a chip or a list line. */
export const FLAG_TEXT: Record<RiskFlag, string> = {
  SAME_DEVICE: "Same device as the referrer",
  SAME_NETWORK: "Same Wi-Fi/network as the referrer",
  VELOCITY: "Too many sign-ups on this code within 24 h",
  DISPOSABLE_EMAIL: "Disposable email",
  AUTO_CLOSED: "Booking closed automatically, not by the salon",
  PHONE_REUSED: "Phone already used for a welcome reward",
};

/** `VELOCITY` names the threshold when the settings are at hand. */
export const flagText = (flag: RiskFlag, velocityPerDay?: number) =>
  flag === "VELOCITY" && velocityPerDay
    ? `More than ${velocityPerDay} sign-ups on this code within 24 h`
    : (FLAG_TEXT[flag] ?? flag);

export const SKIP_LABELS: Record<RewardSkip, string> = {
  REFERRER_INELIGIBLE: "No reward: the referrer can't take part",
  CAP_MONTH: "No reward: the referrer hit the monthly limit",
  CAP_LIFETIME: "No reward: the referrer hit the lifetime limit",
};

/** "TKN-…" / "HS-…" with the salon, for a booking a referral or reward points at. */
export const bookingRefText = (b: AdminBookingRef | null | undefined) => {
  if (!b) return null;
  if (b.status === "MISSING") return "Booking no longer exists";
  return b.reference ?? (b.kind === "HOME" ? "Home visit" : "Salon booking");
};

/** "10% · up to ৳500" / "10% · no cap". */
export const termsText = (percent: number, maxDiscountMinor: number) =>
  `${Math.round(percent * 100) / 100}% · ${maxDiscountMinor > 0 ? `up to ${formatBDT(maxDiscountMinor)}` : "no cap"}`;

/* ---------------------------------------------------------------- reasons */

export const APPROVE_REASONS: ReasonCode[] = [
  { value: "CHECKED_OK", label: "Checked: a genuine referral" },
  { value: "KNOWN_HOUSEHOLD", label: "Same household, but a real new customer" },
  { value: "OTHER", label: "Other" },
];

export const REJECT_REASONS: ReasonCode[] = [
  { value: "SELF_REFERRAL", label: "Self-referral or a second account" },
  { value: "FAKE_BOOKING", label: "Booking was not genuine" },
  { value: "ABUSE", label: "Abuse of the program" },
  { value: "OTHER", label: "Other" },
];

export const REVOKE_REASONS: ReasonCode[] = [
  { value: "ABUSE", label: "Abuse of the program" },
  { value: "ISSUED_IN_ERROR", label: "Issued in error" },
  { value: "CUSTOMER_REQUEST", label: "Customer asked for it" },
  { value: "OTHER", label: "Other" },
];

export const BLOCK_REASONS: ReasonCode[] = [
  { value: "ABUSE", label: "Abuse of the program" },
  { value: "FAKE_ACCOUNTS", label: "Referring their own accounts" },
  { value: "OTHER", label: "Other" },
];

export const UNBLOCK_REASONS: ReasonCode[] = [
  { value: "APPEAL_UPHELD", label: "Appeal upheld" },
  { value: "BLOCKED_IN_ERROR", label: "Blocked in error" },
  { value: "OTHER", label: "Other" },
];

export const RESET_REASONS: ReasonCode[] = [
  { value: "CODE_LEAKED", label: "Code posted publicly / leaked" },
  { value: "CUSTOMER_REQUEST", label: "Customer asked for it" },
  { value: "OTHER", label: "Other" },
];
