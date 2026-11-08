// What the calendar can offer a customer, read off the free slots the API sent.
// Slots belong to counters, so one service can have several slots at the same
// time (one per counter): the desk only cares that the time is free, so those
// collapse into one "option" and booking takes the first of them.

import type { CalendarBooking, CalendarData, CalendarSlot } from "@/services/appoinments/calendar-types";
import { dayOfStamp, minutesOf } from "./calendar-grid";

const GENERAL = "__general";

export const serviceKeyOf = (slot: Pick<CalendarSlot, "serviceId">) => slot.serviceId ?? GENERAL;

/** One bookable service at one time, with every free slot behind it. */
export type FreeOption = {
  key: string;
  serviceKey: string;
  serviceName: string;
  start: string;
  end: string;
  /** "HH:mm" */
  time: string;
  durationMin: number;
  slots: CalendarSlot[];
};

export type ServiceChoice = { key: string; name: string; durationMin: number; count: number };

const durationOf = (slot: CalendarSlot) =>
  Math.max((minutesOf(slot.end) ?? 0) - (minutesOf(slot.start) ?? 0), 0);

/** Free slots deduped by service and start time, in time order. */
export const freeOptions = (slots: CalendarSlot[]): FreeOption[] => {
  const byKey = new Map<string, FreeOption>();
  for (const slot of slots) {
    const serviceKey = serviceKeyOf(slot);
    const key = `${serviceKey}@${slot.start}`;
    const known = byKey.get(key);
    if (known) {
      known.slots.push(slot);
      continue;
    }
    byKey.set(key, {
      key,
      serviceKey,
      serviceName: slot.serviceName ?? "General slot",
      start: slot.start,
      end: slot.end,
      time: slot.start.slice(11, 16),
      durationMin: durationOf(slot),
      slots: [slot],
    });
  }
  return [...byKey.values()].sort(
    (a, b) => a.start.localeCompare(b.start) || a.serviceName.localeCompare(b.serviceName),
  );
};

/** The services that still have a free time, A–Z. */
export const servicesOf = (options: FreeOption[]): ServiceChoice[] => {
  const byKey = new Map<string, ServiceChoice>();
  for (const o of options) {
    const known = byKey.get(o.serviceKey);
    if (known) known.count += 1;
    else byKey.set(o.serviceKey, { key: o.serviceKey, name: o.serviceName, durationMin: o.durationMin, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
};

/** True when the slot hasn't started yet, judged on the salon's wall clock. */
export const notStarted = (start: string, date: string, today: string, nowMin: number) =>
  date > today || (date === today && (minutesOf(start) ?? 0) > nowMin);

/** "30 min", "1 h", "1 h 30 min" */
export const durationLabel = (min: number) => {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
};

export type DaySummary = {
  day: string;
  booked: number;
  free: number;
  closed: boolean;
};

/**
 * Per day of the range: live bookings and free times still bookable. Past
 * days and started slots count as nothing free, as the grid shows them.
 */
export const daySummaries = (
  data: CalendarData,
  days: string[],
  today: string,
  nowMin: number,
  bookingsFor?: (day: string) => number | undefined,
): DaySummary[] =>
  days.map((day) => {
    const hours = data.hours.find((h) => h.day === day);
    const fromList = bookingsFor?.(day);
    const booked =
      fromList ??
      data.bookings.filter((b: CalendarBooking) => dayOfStamp(b.start) === day && b.status !== "CANCELLED").length;
    const free = freeOptions(
      data.openSlots.filter((s) => dayOfStamp(s.start) === day && notStarted(s.start, day, today, nowMin)),
    ).length;
    return { day, booked, free, closed: !!hours?.closed };
  });

/** "AB" from "Ayesha Begum"; one letter for one word. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";
