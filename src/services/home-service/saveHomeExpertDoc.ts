"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeDocSaveInput, HomeExpertRow } from "./types";

/** `POST /home-service/owner/experts/:id/docs`: records an uploaded document (JPG, PNG, WEBP or PDF, up to 8 MB). */
export const saveHomeExpertDoc = async (
  salonId: string,
  id: string,
  input: HomeDocSaveInput,
): Promise<ApiResponse<HomeExpertRow>> =>
  ownerAction<HomeExpertRow>(salonId, "post", `/experts/${enc(id)}/docs`, input, "Couldn't save the document. Please try again.");
