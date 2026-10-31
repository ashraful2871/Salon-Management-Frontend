import type { ReasonCode } from "@/components/Admin/ReasonDialog";
import { formatDay } from "@/components/Admin/users/labels";
import type {
  ExpertGender,
  ExpertVerification,
  HomeAudience,
  HomeReportStatus,
  HomeSafetyKind,
  HomeServiceStatus,
} from "@/services/home-service/types";

export const SIDE_LABELS: Record<HomeAudience, string> = { LADIES: "Ladies", GENTS: "Gents" };

export const GENDER_LABELS: Record<ExpertGender, string> = { FEMALE: "Woman", MALE: "Man" };

export const BRANCH_STATUS_LABELS: Record<Exclude<HomeServiceStatus, "DRAFT">, string> = {
  PENDING_REVIEW: "Waiting",
  ACTIVE: "Live",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const EXPERT_STATUS_LABELS: Record<ExpertVerification, string> = {
  PENDING: "Waiting",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  DRAFT: "Draft",
};

export const REPORT_KIND_LABELS: Record<HomeSafetyKind, string> = {
  SAFETY: "Safety",
  QUALITY: "Quality",
  MISMATCH: "Wrong person",
  HARASSMENT: "Harassment",
  OTHER: "Other",
};

export const REPORT_STATUS_LABELS: Record<HomeReportStatus, string> = {
  OPEN: "Open",
  REVIEWING: "Reviewing",
  ACTIONED: "Actioned",
  DISMISSED: "Dismissed",
};

export const BRANCH_REASONS: ReasonCode[] = [
  { value: "CHECKLIST", label: "The checklist isn't met" },
  { value: "WRONG_SIDE", label: "This side doesn't fit the salon" },
  { value: "AREA", label: "We don't cover this area yet" },
  { value: "POLICY", label: "Breach of our terms" },
  { value: "OTHER", label: "Other" },
];

export const SUSPEND_REASONS: ReasonCode[] = [
  { value: "COMPLAINTS", label: "Repeated customer complaints" },
  { value: "SAFETY", label: "Safety concern" },
  { value: "POLICY", label: "Breach of our terms" },
  { value: "OTHER", label: "Other" },
];

export const UNSUSPEND_REASONS: ReasonCode[] = [
  { value: "RESOLVED", label: "The issue is resolved" },
  { value: "MISTAKE", label: "Suspended by mistake" },
  { value: "OTHER", label: "Other" },
];

export const EXPERT_REJECT_REASONS: ReasonCode[] = [
  { value: "UNREADABLE", label: "A document can't be read" },
  { value: "MISMATCH", label: "The selfie doesn't match the ID" },
  { value: "NAME", label: "The name doesn't match the staff record" },
  { value: "EXPIRED", label: "The ID isn't valid" },
  { value: "OTHER", label: "Other" },
];

export const GENDER_REASONS: ReasonCode[] = [
  { value: "ID", label: "The ID shows a different gender" },
  { value: "TYPO", label: "Entered wrongly at setup" },
  { value: "OTHER", label: "Other" },
];

export const HOME_CANCEL_REASONS: ReasonCode[] = [
  { value: "CUSTOMER_REQUEST", label: "The customer asked us to cancel" },
  { value: "SALON_UNAVAILABLE", label: "The salon can't do the visit" },
  { value: "SAFETY", label: "Safety concern" },
  { value: "DUPLICATE", label: "Duplicate booking" },
  { value: "OTHER", label: "Other" },
];

export const HOME_APPEAL_UPHOLD_REASONS: ReasonCode[] = [
  { value: "Customer showed proof", label: "The customer showed proof" },
  { value: "The salon or expert confirmed it was a mistake", label: "The salon or expert confirmed a mistake" },
  { value: "The visit records do not support the fee", label: "The visit records don't support the fee" },
  { value: "OTHER", label: "Other" },
];

/** The chosen text is the note in the customer's email. */
export const HOME_APPEAL_REJECT_REASONS: ReasonCode[] = [
  { value: "The visit records support the fee", label: "The visit records support the fee" },
  { value: "The appeal gives no detail we could check", label: "Nothing in the appeal we could check" },
  { value: "The policy was shown and accepted when you booked", label: "The policy was accepted at booking" },
  { value: "OTHER", label: "Other" },
];

/** "3 d" / "5 h": how long a queue item has been waiting. */
export const waited = (at: string | null | undefined, now: number | null) => {
  if (!at) return "—";
  if (now == null) return formatDay(at);
  const hours = Math.floor((now - new Date(at).getTime()) / 3_600_000);
  if (hours < 1) return "under 1 h";
  return hours < 48 ? `${hours} h` : `${Math.floor(hours / 24)} d`;
};
