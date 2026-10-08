import type { AdminInboxItem } from "@/services/admin/types";

// Shared by the top-bar bell and Home's "Needs attention", so both name and
// age an item the same way. Keys are the backend's (`admin.service.ts` inbox).
const INBOX_LABELS: Record<string, string> = {
  "salons.pending": "Salons waiting for approval",
  "applications.pending": "Owner applications to review",
  "appeals.pending": "Appeals awaiting a decision",
  "topups.unknown_refund": "Refunds with an unknown result",
  "intents.stuck_pending": "Top-ups stuck in pending",
  "payouts.failed": "Failed payouts",
  "payouts.stale_pending": "Payouts pending too long",
};

export const inboxLabel = (key: string) =>
  INBOX_LABELS[key] ??
  key.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const span = (ms: number) => {
  const minutes = Math.max(1, Math.round(Math.abs(ms) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
};

/** "Due in 5 h" / "Overdue by 2 h" when there is a deadline, else "Oldest 3 d". */
export const inboxAge = (item: AdminInboxItem, nowMs: number): string | null => {
  if (item.dueAt) {
    const left = new Date(item.dueAt).getTime() - nowMs;
    return left >= 0 ? `Due in ${span(left)}` : `Overdue by ${span(left)}`;
  }
  if (item.oldestAt) return `Oldest ${span(nowMs - new Date(item.oldestAt).getTime())}`;
  return null;
};

export const inboxTotal = (items: AdminInboxItem[] | null | undefined) =>
  (items ?? []).reduce((sum, item) => sum + item.count, 0);
