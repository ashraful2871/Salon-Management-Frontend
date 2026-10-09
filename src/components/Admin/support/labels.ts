import type { Tone } from "@/lib/status-tone";
import type { TicketPriority, TicketStatus } from "@/services/admin/support/types";

// Mirrors `Admin/support/support.validation.ts` on the API.
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  PENDING: "Waiting on requester",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
export const TICKET_STATUS_ORDER: TicketStatus[] = ["OPEN", "PENDING", "RESOLVED", "CLOSED"];

export const TICKET_STATUS_TONE: Record<TicketStatus, Tone> = {
  OPEN: "warning",
  PENDING: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};
export const TICKET_PRIORITY_ORDER: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export const TICKET_PRIORITY_TONE: Record<TicketPriority, Tone> = {
  LOW: "neutral",
  NORMAL: "neutral",
  HIGH: "warning",
  URGENT: "danger",
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  BOOKING: "Booking",
  PAYMENT: "Payment",
  ACCOUNT: "Account",
  SALON: "Salon",
  TECHNICAL: "Technical",
  OTHER: "Other",
};
