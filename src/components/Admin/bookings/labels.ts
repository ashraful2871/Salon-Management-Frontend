import type { ReasonCode } from "@/components/Admin/ReasonDialog";
import type { BookingStatus } from "@/services/admin/bookings/types";

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

export const CHANNEL_LABELS: Record<string, string> = {
  WEB: "Website",
  ASSISTANT: "Assistant",
  WALK_IN: "Walk-in",
};

export const SOURCE_LABELS: Record<string, string> = {
  PLATFORM: "Platform",
  SALON_DIRECT: "Salon direct",
};

export const DEPOSIT_LABELS: Record<string, string> = {
  NONE: "No deposit",
  HELD: "Held",
  RELEASED: "Released",
  APPLIED: "Applied",
  FORFEITED: "Forfeited",
  PARTIALLY_FORFEITED: "Part forfeited",
};

export const APPEAL_LABELS: Record<string, string> = {
  PENDING: "Appeal pending",
  APPROVED: "Appeal upheld",
  REJECTED: "Appeal rejected",
};

export const LEDGER_ACCOUNT_LABELS: Record<string, string> = {
  CUSTOMER_WALLET: "Customer wallet",
  SALON_PAYABLE: "Salon payable",
  PLATFORM_REVENUE: "Platform revenue",
  GATEWAY_CLEARING: "Gateway clearing",
};

/** Mirrors `BOOKING_CANCEL_REASON_CODES` in the API's bookings.validation.ts. */
export const CANCEL_REASONS: ReasonCode[] = [
  { value: "CUSTOMER_REQUEST", label: "The customer asked us to cancel" },
  { value: "SALON_UNAVAILABLE", label: "The salon cannot take the booking" },
  { value: "DUPLICATE", label: "Duplicate booking" },
  { value: "PAYMENT_ISSUE", label: "Payment problem" },
  { value: "FRAUD", label: "Suspected fraud" },
  { value: "OTHER", label: "Other" },
];

/** Free text on the audit log; the approve path emails the refund itself. */
export const APPEAL_APPROVE_REASONS: ReasonCode[] = [
  { value: "Customer showed proof they attended", label: "Customer showed proof they attended" },
  { value: "Salon confirmed it was a mistake", label: "Salon confirmed it was a mistake" },
  { value: "Booking records do not support a no-show", label: "Booking records do not support a no-show" },
  { value: "OTHER", label: "Other" },
];

/** The chosen text is the note in the customer's email. */
export const APPEAL_REJECT_REASONS: ReasonCode[] = [
  { value: "The salon's records confirm you did not arrive", label: "Salon records confirm the no-show" },
  { value: "The appeal gives no detail we could check", label: "Nothing in the appeal we could check" },
  { value: "You were reminded twice before the booking", label: "Reminders were sent and the slot was kept" },
  { value: "OTHER", label: "Other" },
];

/** "12 Oct 2026 · 3:30 pm" for a booking's calendar date and wall-clock start. */
export const bookingWhen = (ymd: string, hhmm?: string | null) => {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${ymd.slice(0, 10)}T00:00:00Z`));
  if (!hhmm) return day;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return `${day} · ${hhmm}`;
  return `${day} · ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
