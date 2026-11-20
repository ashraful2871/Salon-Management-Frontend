"use server";

import type { ApiResponse } from "@/lib/api-types";
import { serverFetch } from "@/lib/server-fetch";
import { deviceHeaders } from "@/lib/device-headers";
import type { PromoQuote } from "@/services/referral/types";

/**
 * The booking body without notes. `rewardId`: absent = the best reward, `null`
 * = none, an id = that one (another customer's id answers 404).
 */
export type AppointmentQuoteInput = {
  salonId: string;
  serviceId: string;
  staffId?: string;
  counterId: string;
  slotId: string;
  payInFull?: boolean;
  rewardId?: string | null;
};

/** `POST /appointments/quote`: what this booking costs, with the reward picked and the others it could use. */
export type AppointmentQuote = {
  totalMinor: number;
  total?: number;
  promo: PromoQuote | null;
  /** Every reward that fits this booking, best first. */
  rewardOptions: PromoQuote[];
  depositMinor: number;
  deposit?: number;
  prepaidMinor: number;
  prepaid?: number;
  /** Total − promo − deposit − prepaid. */
  dueAtSalonMinor: number;
  dueAtSalon?: number;
  prepayAllowed: boolean;
};

/** `POST /appointments/quote` (no-store). Nothing is held; the booking re-checks everything. */
export const quoteAppointment = async (
  body: AppointmentQuoteInput,
): Promise<ApiResponse<AppointmentQuote>> => {
  try {
    const res = await serverFetch.post("/appointments/quote", {
      headers: { "Content-Type": "application/json", ...(await deviceHeaders()) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return (await res.json()) as ApiResponse<AppointmentQuote>;
  } catch (error) {
    console.error("quoteAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't price this booking. Please try again.",
    };
  }
};
