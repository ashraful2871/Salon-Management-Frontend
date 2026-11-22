"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { TAGS } from "@/lib/cache-tags";

const rewardOf = (v?: string): { rewardId?: string | null } =>
  !v ? {} : v === "none" ? { rewardId: null } : { rewardId: v };

export const bookingAppointment = async (
  _currentState: ApiResponse<Appointment> | null,
  formData: FormData,
): Promise<ApiResponse<Appointment>> => {
  let result: ApiResponse<Appointment>;
  try {
    const appointmentData = {
      salonId: formData.get("salonId")?.toString(),
      serviceId: formData.get("serviceId")?.toString(),
      staffId: formData.get("staffId")?.toString(),
      counterId: formData.get("counterId")?.toString(),
      slotId: formData.get("slotId")?.toString(),
      notes: formData.get("notes")?.toString() || undefined,
      // "Pay all now" (owner Phase 15); absent = deposit only.
      ...(formData.get("payInFull") === "true" ? { payInFull: true } : {}),
      // Referral reward: an id = that one, "none" = without one, absent = the best.
      ...rewardOf(formData.get("rewardId")?.toString()),
    };

    const res = await serverFetch.post("/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData),
    });

    result = await res.json();

    if (result.success) {
      revalidateTag(TAGS.appointments, "max");
      updateTag(TAGS.myAppointments);
      // A new booking holds a deposit, so both the counts and the held-money
      // figures on every dashboard are now stale.
      revalidateTag(TAGS.dashboardStats, "max");
      revalidateTag(TAGS.ownerHomes, "max");
      revalidateTag(TAGS.earnings, "max");
      revalidateTag(TAGS.slots, "max");
      // A reward may now be reserved for this booking.
      revalidateTag(TAGS.myRewards, "max");
      revalidateTag(TAGS.myReferral, "max");
    }
  } catch (error) {
    console.error("bookingAppointment error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to book appointment.",
    };
  }

  // Straight to the confirmation, from the server. Returning and letting the
  // page navigate instead re-rendered the review page first, against a slot
  // that is now BOOKED, and anything that dropped the success state on the way
  // (a second submit queued behind the first, a remount) left the customer
  // looking at "this time has just been taken" for their own booking.
  // Replace, so Back leads to the time list rather than to a spent review page.
  const booked = result.success ? result.data : undefined;
  if (booked?.id && booked.salon?.id) {
    redirect(
      `/salons/${encodeURIComponent(booked.salon.id)}/book/confirmed?ref=${encodeURIComponent(booked.id)}`,
      RedirectType.replace,
    );
  }

  return result;
};
