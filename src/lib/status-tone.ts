// One colour per status across the app: badges, dots and chips read their
// classes from here instead of picking palette colours locally.

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const TONE_CLASSES: Record<Tone, { soft: string; text: string; dot: string }> = {
  neutral: { soft: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  primary: { soft: "bg-primary-soft", text: "text-primary-hover", dot: "bg-primary" },
  success: { soft: "bg-success-soft", text: "text-success", dot: "bg-success" },
  warning: { soft: "bg-warning-soft", text: "text-warning", dot: "bg-warning" },
  danger: { soft: "bg-danger-soft", text: "text-danger", dot: "bg-danger" },
  info: { soft: "bg-info-soft", text: "text-info", dot: "bg-info" },
};

// Appointment, payment, salon, application and staff statuses (lib/api-types.ts).
// Anything not listed (INACTIVE, OFF, UNRECORDED, NOT_APPLICABLE, …) is neutral.
const STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CHECKED_IN: "primary",
  IN_PROGRESS: "primary",
  COMPLETED: "success",
  APPROVED: "success",
  ACTIVE: "success",
  SUCCESS: "success",
  PAID: "success",
  AVAILABLE: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  REJECTED: "danger",
  FAILED: "danger",
  SUSPENDED: "danger",
  BLOCKED: "danger",
  REFUNDED: "info",
  UNPAID: "warning",
  PARTIALLY_PAID: "warning",
  BUSY: "warning",
};

export const toneOf = (status?: string | null): Tone =>
  (status && STATUS_TONE[status.toUpperCase()]) || "neutral";
