import type { ProviderId } from "@/lib/payment-providers";
import { safeInAppPath } from "@/lib/safe-path";

/**
 * The way back to a half-finished booking after a wallet top-up. The gateway
 * always returns to the wallet result pages (the backend's callback URL cannot
 * carry a booking), so the booking review page's own URL rides here,
 * short-lived, set by `initiateTopup` just before the browser leaves.
 */
export const BOOKING_RESUME_COOKIE = "sm_booking_resume";

export const BOOKING_RESUME_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 30,
};

/** Only a booking review page (`/salons/<id>/book?…`), never anywhere else. */
export const bookingResumePath = (value: unknown): string | null => {
  const path = safeInAppPath(value);
  return path && /^\/salons\/[^/?#]+\/book\?/.test(path) ? path : null;
};

/** The booking review page with the top-up dialog opened again. */
export const bookingTopupHref = (path: string, method?: ProviderId | null) =>
  `${path}&topup=1${method ? `&method=${method}` : ""}`;
