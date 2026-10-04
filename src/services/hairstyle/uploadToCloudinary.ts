import type { ApiResponse } from "@/lib/api-types";
import type { UploadTicket } from "./types";

/**
 * Browser-only. The photo goes straight to Cloudinary with the API's signed
 * ticket, so it never passes through our servers - the one service that calls
 * a host directly. XHR rather than fetch, for upload progress.
 */
export const uploadToCloudinary = (
  file: Blob,
  ticket: UploadTicket,
  onProgress?: (percent: number) => void,
): Promise<ApiResponse<{ version: number | string; signature: string }>> =>
  new Promise((resolve) => {
    const failed = (message: string) => resolve({ success: false, message });

    const form = new FormData();
    form.append("file", file, "photo.jpg");
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
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      const body = xhr.response as {
        version?: number | string;
        signature?: string;
        error?: { message?: string };
      } | null;

      if (xhr.status >= 200 && xhr.status < 300 && body?.version && body.signature) {
        onProgress?.(100);
        resolve({
          success: true,
          message: "Uploaded",
          data: { version: body.version, signature: body.signature },
        });
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
