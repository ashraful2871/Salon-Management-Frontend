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

// "2026-09-21" -> "Mon, 21 Sep". Dates are calendar days, so read them as UTC.
export const formatDay = (ymd: string) =>
  new Date(`${ymd.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
