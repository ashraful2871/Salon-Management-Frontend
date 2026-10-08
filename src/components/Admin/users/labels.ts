import type { ReasonCode } from "@/components/Admin/ReasonDialog";
import type { AccountRole } from "@/services/admin/users/types";

export const ROLE_LABELS: Record<AccountRole, string> = {
  CUSTOMER: "Customer",
  SALON_OWNER: "Salon owner",
  STAFF: "Staff",
  AGENT: "Agent",
  ADMIN: "Admin",
};

/** Mirrors `STATUS_REASON_CODES` in the API's users.validation.ts. */
export const STATUS_REASONS: ReasonCode[] = [
  { value: "FRAUD", label: "Suspected fraud" },
  { value: "ABUSE", label: "Abusive behaviour" },
  { value: "SPAM", label: "Spam or fake bookings" },
  { value: "PAYMENT_ISSUE", label: "Payment issue" },
  { value: "POLICY_VIOLATION", label: "Breach of our terms" },
  { value: "USER_REQUEST", label: "At the account holder's request" },
  { value: "OTHER", label: "Other" },
];

export const REACTIVATE_REASONS: ReasonCode[] = [
  { value: "RESOLVED", label: "Issue resolved" },
  { value: "USER_REQUEST", label: "At the account holder's request" },
  { value: "OTHER", label: "Other" },
];

/** For tier-3 actions whose API takes a free-text `reason`. */
export const ACCESS_REASONS: ReasonCode[] = [
  { value: "Identity confirmed by support", label: "Identity confirmed by support" },
  { value: "At the account holder's request", label: "At the account holder's request" },
  { value: "Correcting a mistake", label: "Correcting a mistake" },
  { value: "OTHER", label: "Other" },
];

/** The reason text an API with a free-text `reason` gets from a ReasonDialog. */
export const reasonText = (codes: ReasonCode[], input: { reasonCode: string; note: string }) => {
  const label = codes.find((c) => c.value === input.reasonCode)?.label ?? input.reasonCode;
  if (input.reasonCode === "OTHER") return input.note;
  return input.note ? `${label}: ${input.note}` : label;
};

const DAY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDay = (at: string | Date | null | undefined) => (at ? DAY.format(new Date(at)) : "—");

/** "5 min ago", "3 h ago", "12 d ago", then the date. */
export const timeAgo = (at: string | null | undefined, now = Date.now()) => {
  if (!at) return "Never";
  const minutes = Math.round((now - new Date(at).getTime()) / 60000);
  if (minutes < 15) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} d ago` : formatDay(at);
};
