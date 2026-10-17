/** One weekly shift, Asia/Dhaka wall clock. `weekday` 0 = Sunday … 6. */
export type StaffShift = { weekday: number; startTime: string; endTime: string };

/** `GET|PUT /staff/:id/shifts`. No shifts = works whenever the salon is open. */
export type StaffShifts = { staffId: string; name: string; salonId: string; shifts: StaffShift[] };

/** `GET /staff/:id/time-off` (current, future and the last 30 days). */
export type StaffTimeOff = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdAt: string;
};

/** `POST /staff/:id/time-off`: bookings already in that window are counted, never moved. */
export type AddedTimeOff = StaffTimeOff & { clashingBookings: number };

/** `GET /staff/availability?appointmentId=`. */
export type StaffAvailability = {
  staffId: string;
  working: boolean;
  reason: "OFF_SHIFT" | "TIME_OFF" | null;
};

/** `GET /owner/team/performance`. */
export type PerformanceRow = {
  staffId: string | null;
  name: string;
  salonId: string;
  salonName: string;
  bookings: number;
  completed: number;
  noShows: number;
  revenueMinor: number;
  avgTicketMinor: number;
  rating: number | null;
  reviews: number;
  bookedMinutes: number;
  availableMinutes: number | null;
  utilisation: number | null;
};

export type TeamPerformance = {
  from: string;
  to: string;
  rows: PerformanceRow[];
  totals: {
    bookings: number;
    completed: number;
    noShows: number;
    revenueMinor: number;
    avgTicketMinor: number;
    bookedMinutes: number;
    availableMinutes: number;
    utilisation: number | null;
  };
};
