import type { ReasonCode } from "@/components/Admin/ReasonDialog";

// Mirrors `Admin/reviews/reviews.validation.ts` on the API.
export const REVIEW_HIDE_REASONS: ReasonCode[] = [
  { value: "ABUSIVE", label: "Abusive or hateful language" },
  { value: "PERSONAL_INFO", label: "Shares personal information" },
  { value: "SPAM_OR_FAKE", label: "Spam or not a genuine visit" },
  { value: "OFF_TOPIC", label: "Not about the salon or the visit" },
  { value: "CONFLICT_OF_INTEREST", label: "Written by someone connected to the salon" },
  { value: "OTHER", label: "Other" },
];

export const REVIEW_RESTORE_REASONS: ReasonCode[] = [
  { value: "NOT_A_VIOLATION", label: "It does not break the guidelines" },
  { value: "HIDDEN_BY_MISTAKE", label: "It was hidden by mistake" },
  { value: "OTHER", label: "Other" },
];

/** What a customer or owner picks when reporting (`POST /reviews/:id/report`). */
export const REPORT_REASON_LABELS: Record<string, string> = {
  ABUSIVE: "Abusive or offensive",
  PERSONAL_INFO: "Shares personal information",
  SPAM: "Spam or advertising",
  FAKE: "Fake, not a real visit",
  OTHER: "Something else",
};

export const hideReasonLabel = (code: string | null) =>
  REVIEW_HIDE_REASONS.find((r) => r.value === code)?.label ?? code ?? "—";
