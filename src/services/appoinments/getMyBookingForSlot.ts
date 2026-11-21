import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment, AppointmentStatus } from "@/lib/api-types";

/** A booking that still holds its slot. */
const HOLDS_SLOT: AppointmentStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"];

/**
 * The signed-in customer's live booking on this slot, if they have one. The
 * review page asks when a slot turns out to be taken, so that a customer who
 * already booked it (another tab, a double submit, a reload) is shown their
 * confirmation instead of "someone else took this time".
 *
 * Server-only (the review page). Never cached: it answers for this moment.
 */
export const getMyBookingForSlot = async (
  slotId: string,
): Promise<Appointment | undefined> => {
  try {
    const params = new URLSearchParams({ slotId, limit: "5" });
    const response = await serverFetch.get(
      `/appointments/my-appointments?${params.toString()}`,
      { cache: "no-store" },
    );
    const result: ApiResponse<Appointment[]> = await response.json();
    if (!result.success || !Array.isArray(result.data)) return undefined;
    return result.data.find((a) => HOLDS_SLOT.includes(a.status));
  } catch (error) {
    console.error("getMyBookingForSlot error:", error);
    return undefined;
  }
};
