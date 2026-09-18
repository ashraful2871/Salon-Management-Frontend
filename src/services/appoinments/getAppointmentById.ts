import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/**
 * The full record behind one booking — richer than the list endpoint, which
 * omits the counter and the frozen money figures. Used by the confirmation
 * page, so it is deliberately uncached: it is read once, right after the write
 * that created it.
 */
export type AppointmentDetail = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: string;
  notes?: string | null;
  /** Frozen onto the appointment at booking time. Poisha. */
  totalMinor: number;
  depositMinor: number;
  depositStatus?: string;
  salon?: {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
  };
  service?: {
    id: string;
    name: string;
    duration?: number | null;
    priceMinor?: number | null;
  };
  staff?: { id: string; user?: { name?: string } } | null;
  counter?: { id: string; name: string; code?: string | null } | null;
};

export const getAppointmentById = async (
  id: string,
): Promise<ApiResponse<AppointmentDetail>> => {
  try {
    const response = await serverFetch.get(`/appointments/${id}`, {
      cache: "no-store",
    });

    return await response.json();
  } catch (error) {
    console.error("getAppointmentById error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load this booking.",
    };
  }
};
