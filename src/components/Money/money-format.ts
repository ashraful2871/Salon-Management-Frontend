import type { MoneyBucket, TransactionType } from "@/services/owner/money-types";
import type { Tone } from "@/lib/status-tone";

export const TYPE_LABEL: Record<TransactionType, string> = {
  booking: "Booking",
  no_show: "No-show",
  late_cancel: "Late cancel",
  commission: "Commission",
  goodwill: "Goodwill",
  dues: "Dues",
  payout_adjustment: "Adjustment",
};

export const BUCKET_LABEL: Record<MoneyBucket, { label: string; tone: Tone }> = {
  pending: { label: "Clearing", tone: "warning" },
  available: { label: "Next payout", tone: "info" },
  in_payout: { label: "On its way", tone: "primary" },
  paid: { label: "Paid", tone: "success" },
};

/** The booking list filtered to one token (any date). */
export const bookingHref = (token: string) =>
  `/dashboard/appointments?date=all&searchTerm=${encodeURIComponent(token)}`;

/** `YYYY-MM-DD` in Asia/Dhaka. */
const dhakaYmd = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(date);

export const DATE_PRESETS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

/** A preset as inclusive Dhaka days for the API's `from` / `to`. */
export const presetRange = (preset: string | undefined, now = new Date()) => {
  const today = dhakaYmd(now);
  const daysAgo = (n: number) => dhakaYmd(new Date(now.getTime() - n * 86_400_000));
  const [y, m] = today.split("-").map(Number);
  switch (preset) {
    case "7d":
      return { from: daysAgo(6), to: today };
    case "30d":
      return { from: daysAgo(29), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "last-month": {
      const py = m === 1 ? y - 1 : y;
      const pm = m === 1 ? 12 : m - 1;
      const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      const mm = String(pm).padStart(2, "0");
      return { from: `${py}-${mm}-01`, to: `${py}-${mm}-${last}` };
    }
    default:
      return {};
  }
};
