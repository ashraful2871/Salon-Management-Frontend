"use server";

import { serverFetch } from "@/lib/server-fetch";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { ApiResponse } from "@/lib/api-types";

const FIELDS = ["name", "email", "subject", "message", "company"] as const;

/** `values` is what the visitor typed, so the form can show it again. */
export type ContactState = ApiResponse<{ ticketNumber: number } | null> & {
  values?: Record<string, string>;
};

/**
 * The contact form's Server Action (`useActionState`) → `POST /contact`.
 * `company` is the hidden honeypot field; the API rejects any value in it.
 */
export const sendContactMessage = async (
  _prev: ContactState | null,
  formData: FormData,
): Promise<ContactState> => {
  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  try {
    const response = await serverFetch.post("/contact", {
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        ...(await clientIpHeaders()),
      },
    });

    const result: ApiResponse<{ ticketNumber: number } | null> = await response.json();

    if (!result.success) {
      return {
        success: false,
        // The API's zod message is just "Validation error"; the browser's own
        // checks catch almost everything before it gets here.
        message:
          result.message === "Validation error"
            ? "Please check your name, email and message, then try again."
            : result.message,
        values,
      };
    }

    // The success card thanks the visitor by name and email.
    return { success: true, message: result.message, data: result.data ?? null, values };
  } catch (error) {
    console.error("sendContactMessage error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "We couldn't send your message. Please try again or email us.",
      values,
    };
  }
};
