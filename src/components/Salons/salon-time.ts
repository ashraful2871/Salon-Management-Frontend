import type { DayKey, OperatingHours, SalonClosureView } from "./salon-view";

/** Monday first, the way the hours table reads. */
export const DAYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const DAY_LABEL: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const BY_INDEX: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Today as YYYY-MM-DD in Dhaka, the calendar slots and closures use. */
export const dhakaToday = (at: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(at);

/** The weekday of a YYYY-MM-DD date. */
export const dayKeyOf = (ymd: string): DayKey => BY_INDEX[new Date(`${ymd}T00:00:00Z`).getUTCDay()];

/** YYYY-MM-DD plus `n` days. */
export const addDaysYmd = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** "Wed 5 Nov" etc. for a YYYY-MM-DD date, read as a calendar day. */
export const formatYmd = (ymd: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** "21:30" -> "9:30 PM". */
export const formatClock = (t?: string | null) => {
  if (!t) return "";
  const [hStr, m = "00"] = t.split(":");
  const h = Number(hStr);
  if (!Number.isFinite(h)) return t;
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
};

/** Weekday and minutes past midnight in Dhaka. */
const dhakaNow = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    day: get("weekday").toLowerCase() as DayKey,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    ymd: dhakaToday(),
  };
};

export type OpenState = {
  open: boolean;
  /** "until 9:30 PM", "opens at 11:00 AM", or "" when there is nothing more to say today. */
  detail: string;
  today: DayKey;
};

export function openState(hours: OperatingHours, closures: SalonClosureView[] = []): OpenState {
  const now = dhakaNow();
  const h = hours[now.day];
  const closedAllDay = closures.some((c) => c.date === now.ymd && c.allDay);
  if (!h?.open || !h?.close || closedAllDay) return { open: false, detail: "", today: now.day };

  const open = toMinutes(h.open);
  const close = toMinutes(h.close);
  const isOpen =
    close >= open ? now.minutes >= open && now.minutes < close : now.minutes >= open || now.minutes < close;
  if (isOpen) return { open: true, detail: `until ${formatClock(h.close)}`, today: now.day };
  if (now.minutes < open) return { open: false, detail: `opens at ${formatClock(h.open)}`, today: now.day };
  return { open: false, detail: "", today: now.day };
}
