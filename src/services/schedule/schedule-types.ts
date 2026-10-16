export type SalonClosure = {
  id: string;
  /** Dhaka calendar day, "YYYY-MM-DD". */
  date: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  createdAt?: string;
  blockedSlots?: number;
};

export type ClosureBooking = {
  id: string;
  startTime: string;
  endTime: string | null;
  status: string;
  serialNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  serviceName: string | null;
};

export type CreateClosureResult = {
  closure: SalonClosure;
  /** Bookings already inside the closure: listed, never cancelled. */
  bookings: ClosureBooking[];
  notice: string | null;
};

export type BookingPauseKind = "NONE" | "OWNER" | "DUES";

export type BookingPauseState = {
  bookingPause: BookingPauseKind;
  bookingPauseReason: string | null;
  bookingPauseUntil: string | null;
  bookingPausedAt: string | null;
};
