"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc, homeSend } from "./request";
import type { HomeDocKind, HomeDocSignature } from "./types";

/**
 * `POST /home-service/owner/experts/:id/doc-upload-signature`: a signed ticket
 * for one private ID / selfie upload straight to Cloudinary. Then call
 * `saveHomeExpertDoc` with the `public_id` it returns. Changes nothing yet.
 */
export const getHomeDocSignature = async (id: string, kind: HomeDocKind): Promise<ApiResponse<HomeDocSignature>> =>
  homeSend<HomeDocSignature>(
    "post",
    `/home-service/owner/experts/${enc(id)}/doc-upload-signature`,
    { kind },
    "Couldn't prepare the upload. Please try again.",
  );
