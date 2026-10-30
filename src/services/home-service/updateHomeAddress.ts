"use server";

import { updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";
import type { HomeAddress, HomeAddressInput } from "./types";

/** `PATCH /home-service/addresses/:id`. `isDefault: true` moves the default here; it can't be turned off. */
export const updateHomeAddress = async (
  id: string,
  input: Partial<HomeAddressInput>,
): Promise<ApiResponse<HomeAddress>> => {
  const result = await homeSend<HomeAddress>(
    "patch",
    `/home-service/addresses/${enc(id)}`,
    input,
    "Couldn't update the address. Please try again.",
  );
  if (result.success) updateTag(TAGS.homeAddresses);
  return result;
};
