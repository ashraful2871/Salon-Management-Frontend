import { formatBDT } from "@/lib/money";

/**
 * `.ics` built in the browser rather than fetched: the whole event is already
 * on the page, so a data URL is the entire feature. Times are the salon's wall
 * clock with no zone, which is what a floating VEVENT means — the right answer
 * for an appointment you attend in person.
 */
export type CalendarEvent = {
  id: string;
  /** `YYYY-MM-DD` (anything longer is cut to the calendar part). */
  date: string;
  /** `HH:mm` */
  startTime: string;
  endTime?: string | null;
  title: string;
  location?: string | null;
  description?: string;
};

export function calendarHref(event: CalendarEvent): string {
  const day = event.date.slice(0, 10).replace(/-/g, "");
  const stamp = (time: string) => `${day}T${time.replace(":", "")}00`;

  const escape = (value: string) =>
    value.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SalonKhuji//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@salonkhuji`,
    `DTSTART:${stamp(event.startTime)}`,
    `DTEND:${stamp(event.endTime ?? event.startTime)}`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(event.location ?? "")}`,
    `DESCRIPTION:${escape(event.description ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

/** The note a booking's calendar entry carries: what to show and what to pay. */
export const bookingEventDescription = ({
  token,
  serialNumber,
  dueAtSalonMinor,
}: {
  token?: string | null;
  serialNumber?: number | null;
  dueAtSalonMinor: number;
}) =>
  [
    token ? `Token ${token}` : "",
    serialNumber ? `Serial #${serialNumber}` : "",
    dueAtSalonMinor > 0
      ? `Pay ${formatBDT(dueAtSalonMinor)} at the salon`
      : "Nothing left to pay at the salon",
  ]
    .filter(Boolean)
    .join(" · ");

export const calendarFileName = (salonName: string, date: string) =>
  `${salonName.replace(/[^\w-]+/g, "-")}-${date.slice(0, 10)}.ics`;
