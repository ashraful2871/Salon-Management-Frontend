"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

export type CreateBulkSlotsPayload = {
  salonId: string;
  serviceId: string;
  /** Inclusive range. Pass the same value for both to generate a single day. */
  startDate: string;
  endDate: string;
  /** Omit to leave the slots unassigned to any counter. */
  counterId?: string;
  startTime: string;
  endTime: string;
  duration: number;
  breakDuration: number;
};

export const createBulkSlots = async (payload: CreateBulkSlotsPayload) => {
  try {
    const response = await serverFetch.post("/slots/bulk-create", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.success) {
      revalidateTag("slots", "max");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to create slots" };
  }
};

export const getSlots = async (params: {
  salonId?: string;
  date?: string;
  status?: string;
  serviceId?: string;
  /**
   * Drops slots whose start time has already passed. Booking screens want it;
   * the owner's slot manager does not, since it still has to show and clean up
   * earlier in the day.
   */
  upcomingOnly?: boolean;
}) => {
  try {
    const searchParams = new URLSearchParams();
    if (params.salonId) searchParams.append("salonId", params.salonId);
    if (params.date) searchParams.append("date", params.date);
    if (params.status) searchParams.append("status", params.status);
    if (params.serviceId) searchParams.append("serviceId", params.serviceId);
    if (params.upcomingOnly) searchParams.append("upcomingOnly", "true");

    const response = await serverFetch.get(`/slots?${searchParams.toString()}`, {
      next: { tags: ["slots"] },
      // An upcoming-only list is only correct at the moment it was built, and
      // no tag gets revalidated simply because time passed. Caching it would
      // let an 11am response still be offering 10am at half past four.
      ...(params.upcomingOnly ? { cache: "no-store" as const } : {}),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: "Failed to get slots" };
  }
};

export const updateSlotStatus = async (slotId: string, status: string) => {
  try {
    const response = await serverFetch.patch(`/slots/${slotId}/status`, {
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.success) {
      revalidateTag("slots", "max");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to update slot status" };
  }
};

export const deleteSlot = async (slotId: string) => {
  try {
    const response = await serverFetch.delete(`/slots/${slotId}`);
    const data = await response.json();
    if (data.success) {
      revalidateTag("slots", "max");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to delete slot" };
  }
};

export const deleteBulkSlots = async (slotIds: string[]) => {
  try {
    const response = await serverFetch.post("/slots/bulk-delete", {
      body: JSON.stringify({ slotIds }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.success) {
      revalidateTag("slots", "max");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to delete slots in bulk" };
  }
};
