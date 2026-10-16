"use server";

import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { BranchRole } from "./team-types";

type MemberResult = { id: string; futureBookings?: number };

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

// A seat change moves a stylist on or off the salon's staff list and changes
// what the member may open; the access lists refresh in the background.
const expire = (salonId: string) => {
  updateTag(TAGS.salonMembers(salonId));
  revalidateTag(TAGS.salon(salonId), "max");
  revalidateTag(TAGS.ownerAccess, "max");
};

/** `PATCH /salons/:salonId/members/:memberId`: role, or suspend / reactivate. */
export const updateMember = async (
  salonId: string,
  memberId: string,
  change: { role?: BranchRole; status?: "ACTIVE" | "SUSPENDED" },
): Promise<ApiResponse<MemberResult>> => {
  try {
    const response = await serverFetch.patch(
      `/salons/${encodeURIComponent(salonId)}/members/${encodeURIComponent(memberId)}`,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
        cache: "no-store",
      },
    );
    const result = (await response.json()) as ApiResponse<MemberResult>;
    if (result.success) expire(salonId);
    return result;
  } catch (error) {
    console.error("updateMember error:", error);
    return failure(error, "Couldn't update this member. Please try again.");
  }
};

/** `DELETE /salons/:salonId/members/:memberId`. Their bookings stay; the count comes back. */
export const removeMember = async (
  salonId: string,
  memberId: string,
): Promise<ApiResponse<MemberResult>> => {
  try {
    const response = await serverFetch.delete(
      `/salons/${encodeURIComponent(salonId)}/members/${encodeURIComponent(memberId)}`,
      { cache: "no-store" },
    );
    const result = (await response.json()) as ApiResponse<MemberResult>;
    if (result.success) expire(salonId);
    return result;
  } catch (error) {
    console.error("removeMember error:", error);
    return failure(error, "Couldn't remove this member. Please try again.");
  }
};

/** `PATCH /salons/:id { managerCanEditServices }`, owner only (policy.manage). */
export const setManagerCanEditServices = async (
  salonId: string,
  enabled: boolean,
): Promise<ApiResponse> => {
  try {
    const response = await serverFetch.patch(`/salons/${encodeURIComponent(salonId)}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerCanEditServices: enabled }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse;
    if (result.success) {
      updateTag(TAGS.salon(salonId));
      revalidateTag(TAGS.ownerAccess, "max");
    }
    return result;
  } catch (error) {
    console.error("setManagerCanEditServices error:", error);
    return failure(error, "Couldn't save this setting. Please try again.");
  }
};
