import type { ApiResponse } from "@/lib/api-types";
import type { SalonPhotoTicket } from "./salon-photo-types";

/**
 * Browser-only. Sends one photo straight to Cloudinary with the API's signed
 * ticket and resolves with its public https URL. XHR rather than fetch, for
 * upload progress.
 */
export const uploadSalonPhoto = (
  file: Blob,
  ticket: Pick<SalonPhotoTicket, "apiKey" | "uploadUrl" | "params">,
  onProgress?: (percent: number) => void,
): Promise<ApiResponse<{ url: string }>> =>
  new Promise((resolve) => {
    const failed = (message: string) => resolve({ success: false, message });

    const form = new FormData();
    form.append("file", file, "salon-photo.jpg");
    form.append("api_key", ticket.apiKey);
    // The signature covers these exact values; changing one voids it.
    for (const [key, value] of Object.entries(ticket.params)) {
      form.append(key, String(value));
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", ticket.uploadUrl);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // The last few percent are Cloudinary processing, not the network.
        onProgress(Math.min(95, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      const body = xhr.response as { secure_url?: string; error?: { message?: string } } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.secure_url) {
        onProgress?.(100);
        resolve({ success: true, message: "Uploaded", data: { url: body.secure_url } });
        return;
      }
      failed(
        process.env.NODE_ENV === "development" && body?.error?.message
          ? body.error.message
          : "The upload didn't go through. Please try again.",
      );
    };
    xhr.onerror = () =>
      failed("The upload didn't go through. Check your connection and try again.");
    xhr.ontimeout = xhr.onerror;
    xhr.timeout = 120_000;

    xhr.send(form);
  });
