import type { CounterPaymentMethod } from "@/lib/api-types";

// The ways a balance can be taken at the counter, in the order they are offered.
export const COUNTER_PAYMENT_METHODS: {
  value: CounterPaymentMethod;
  label: string;
  icon: string;
}[] = [
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "CARD", label: "Card", icon: "💳" },
  { value: "MOBILE_BANKING", label: "bKash / Nagad", icon: "📱" },
];

export const paymentMethodLabel = (method?: string | null) => {
  if (!method) return null;
  const known = COUNTER_PAYMENT_METHODS.find((m) => m.value === method);
  if (known) return known.label;
  return method
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// "14:30" -> "2:30 PM". Slot times are zero-padded 24h strings.
export const formatTime12 = (hhmm?: string) => {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

// Today's calendar day in Dhaka, as YYYY-MM-DD.
export const dhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(
    new Date(),
  );

// "2026-09-26" -> "Sat 26 Sep". Dates are calendar days, so read them as UTC.
// Built from parts: en-GB now prints "Sept", and en-US puts the month first.
const DAY_PARTS = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDay = (ymd: string, withYear = false) => {
  const parts = Object.fromEntries(
    DAY_PARTS.formatToParts(new Date(`${ymd.slice(0, 10)}T00:00:00Z`)).map(
      (p) => [p.type, p.value],
    ),
  );
  const day = `${parts.weekday} ${parts.day} ${parts.month}`;
  return withYear ? `${day} ${parts.year}` : day;
};

// "2026-09-26", -1 -> "2026-09-25". Calendar arithmetic in UTC, so no DST edge.
export const addDays = (ymd: string, delta: number) => {
  const d = new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

/**
 * When the appointment actually begins. The backend reads "HH:mm" against the
 * appointment's date in server-local time, so we do the same here - a mismatch
 * would show a Cancel button the API is about to refuse.
 */
export const startsAtOf = (ymd: string, hhmm?: string) => {
  if (!ymd || !hhmm) return null;
  const parsed = new Date(`${ymd}T${hhmm.padStart(5, "0")}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
