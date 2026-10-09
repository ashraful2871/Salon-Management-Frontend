import type { ReasonCode } from "@/components/Admin/ReasonDialog";
import type { AdminSalonRow, AdminSalonStatus } from "@/services/admin/salons/types";

/** Mirrors `SALON_REASON_CODES` in the API's Admin/salons/salons.validation.ts. */
export const SALON_REASONS: ReasonCode[] = [
  { value: "INCOMPLETE_DETAILS", label: "Details are incomplete" },
  { value: "WRONG_LOCATION", label: "The map pin or address is wrong" },
  { value: "DUPLICATE", label: "This salon is already listed" },
  { value: "NOT_A_SALON", label: "This is not a salon" },
  { value: "POLICY", label: "Breach of our terms" },
  { value: "OTHER", label: "Other" },
];

export const SALON_STATUS_LABELS: Record<AdminSalonStatus, string> = {
  PENDING_APPROVAL: "Pending",
  ACTIVE: "Live",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  INACTIVE: "Inactive",
};

export const SALON_STATUS_ORDER: AdminSalonStatus[] = [
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "INACTIVE",
];

export type ChecklistItem = { key: string; label: string; ok: boolean };

type ChecklistSource = Pick<
  AdminSalonRow,
  "address" | "phone" | "latitude" | "locationAccuracy" | "imageCount" | "pricedServices" | "hasHours"
>;

/** What a salon needs before it goes live; the review sheet shows each line. */
export const salonChecklist = (s: ChecklistSource): ChecklistItem[] => [
  { key: "contact", label: "Address and phone", ok: !!s.address?.trim() && !!s.phone?.trim() },
  { key: "pin", label: "Exact map pin", ok: s.latitude != null && s.locationAccuracy === "EXACT" },
  { key: "photo", label: "At least one photo", ok: s.imageCount > 0 },
  { key: "service", label: "At least one priced service", ok: s.pricedServices > 0 },
  { key: "hours", label: "Opening hours", ok: s.hasHours },
];

/** "3 d", "5 h": how long a pending salon has waited. */
export const waitingFor = (since: string, now = Date.now()) => {
  const hours = Math.max(0, Math.round((now - new Date(since).getTime()) / 3600000));
  if (hours < 1) return "< 1 h";
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
};
