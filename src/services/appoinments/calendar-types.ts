/**
 * `GET /appointments/calendar` (backend `appointment.calendar.ts`). Times are
 * wall-clock "YYYY-MM-DDTHH:mm" with no zone; the grid only reads minutes.
 */
/** When a stylist can't take work: outside their shifts ("OFF") or on time off ("LEAVE"). */
export type CalendarOffRange = { start: string; end: string; kind: "OFF" | "LEAVE"; reason: string | null };

export type CalendarResource = {
  id: string;
  kind: "STAFF" | "COUNTER";
  name: string;
  /** Stylists only. */
  off?: CalendarOffRange[];
};

export type CalendarBooking = {
  id: string;
  resourceId: string;
  start: string;
  end: string;
  status: string;
  token: string | null;
  serialNumber: number | null;
  serviceId: string;
  customerName: string;
  serviceName: string;
  paymentState: string;
};

export type CalendarSlot = {
  id: string;
  /** null in stylist mode: slots belong to counters, so they sit in an "Open" lane. */
  resourceId: string | null;
  serviceId: string | null;
  serviceName: string | null;
  start: string;
  end: string;
};

export type CalendarData = {
  salon: { id: string; name: string };
  view: "day" | "week";
  from: string;
  to: string;
  mode: "STAFF" | "COUNTER";
  readOnly: boolean;
  resources: CalendarResource[];
  bookings: CalendarBooking[];
  blocked: Array<{ resourceId: string | null; start: string; end: string; reason: string }>;
  openSlots: CalendarSlot[];
  hours: Array<{ day: string; open: string | null; close: string | null; closed: boolean }>;
};
