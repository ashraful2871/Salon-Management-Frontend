"use server";

import { updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeSend } from "./request";
import type { HomeAddress, HomeAddressInput } from "./types";

/** `POST /home-service/addresses` (up to 10; the first one is the default). */
export const createHomeAddress = async (input: HomeAddressInput): Promise<ApiResponse<HomeAddress>> => {
  const result = await homeSend<HomeAddress>(
    "post",
    "/home-service/addresses",
    input,
    "Couldn't save the address. Please try again.",
  );
  if (result.success) updateTag(TAGS.homeAddresses);
  return result;
};
