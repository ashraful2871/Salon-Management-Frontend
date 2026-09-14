"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

export const createBulkSlots = async (payload: any) => {
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

export const getSlots = async (params: { salonId?: string; date?: string; status?: string }) => {
  try {
    const searchParams = new URLSearchParams();
    if (params.salonId) searchParams.append("salonId", params.salonId);
    if (params.date) searchParams.append("date", params.date);
    if (params.status) searchParams.append("status", params.status);

    const response = await serverFetch.get(`/slots?${searchParams.toString()}`, {
      next: { tags: ["slots"] },
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
