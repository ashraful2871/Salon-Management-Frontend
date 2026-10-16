"use server";

import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { BulkPriceInput, BulkPriceResult, CopyServicesResult } from "./catalogue-types";

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

const send = async <T>(method: "post" | "patch", path: string, body: unknown): Promise<ApiResponse<T>> => {
  const response = await serverFetch[method](path, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return (await response.json()) as ApiResponse<T>;
};

// The owner is looking at the services list; branch pages refresh behind.
const expireServices = (salonIds: string[]) => {
  updateTag(TAGS.myServices);
  revalidateTag(TAGS.services, "max");
  revalidateTag(TAGS.salons, "max");
  revalidateTag(TAGS.salonCompleteness, "max");
  for (const id of salonIds) revalidateTag(TAGS.salon(id), "max");
};

/** `POST /owner/services/copy`: names already at a branch are skipped (case-insensitive). */
export const copyServicesToBranches = async (body: {
  fromSalonId: string;
  toSalonIds: string[];
  serviceIds?: string[];
}): Promise<ApiResponse<CopyServicesResult>> => {
  try {
    const result = await send<CopyServicesResult>("post", "/owner/services/copy", body);
    if (result.success) expireServices(body.toSalonIds);
    return result;
  } catch (error) {
    console.error("copyServicesToBranches error:", error);
    return failure(error, "Couldn't copy the services. Please try again.");
  }
};

/** `PATCH /owner/services/bulk-price[?dryRun=1]`: the preview and the apply share one calculation. */
export const changePriceAcrossBranches = async (
  body: BulkPriceInput,
  dryRun: boolean,
): Promise<ApiResponse<BulkPriceResult>> => {
  try {
    const result = await send<BulkPriceResult>(
      "patch",
      `/owner/services/bulk-price${dryRun ? "?dryRun=1" : ""}`,
      body,
    );
    if (result.success && !dryRun) expireServices(body.salonIds);
    return result;
  } catch (error) {
    console.error("changePriceAcrossBranches error:", error);
    return failure(error, "Couldn't change the prices. Please try again.");
  }
};

/** `POST /owner/salons/copy-hours`. */
export const copyHoursToBranches = async (body: {
  fromSalonId: string;
  toSalonIds: string[];
}): Promise<ApiResponse<{ updated: number }>> => {
  try {
    const result = await send<{ updated: number }>("post", "/owner/salons/copy-hours", body);
    if (result.success) {
      revalidateTag(TAGS.salons, "max");
      revalidateTag(TAGS.salonCompleteness, "max");
      updateTag(TAGS.mySalons);
      for (const id of body.toSalonIds) revalidateTag(TAGS.salon(id), "max");
    }
    return result;
  } catch (error) {
    console.error("copyHoursToBranches error:", error);
    return failure(error, "Couldn't copy the hours. Please try again.");
  }
};
