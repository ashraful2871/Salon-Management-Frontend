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

/** A home visit's own page: where a gateway trip for its advance comes back to. */
export const homeBookingPath = (id: string) => `/home-service/booking/${encodeURIComponent(id)}`;

/**
 * Only a booking review page (`/salons/<id>/book?…`) or a home visit's page
 * (`/home-service/booking/<id>`), never anywhere else.
 */
export const bookingResumePath = (value: unknown): string | null => {
  const path = safeInAppPath(value);
  return path &&
    (/^\/salons\/[^/?#]+\/book\?/.test(path) || /^\/home-service\/booking\/[^/?#]+(\?|$)/.test(path))
    ? path
    : null;
};

/** The booking page without the gateway-return `via`: the payment ended, so its page has nothing to wait for. */
export const bookingRetryPath = (path: string) => {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("via");
  const rest = params.toString();
  return rest ? `${base}?${rest}` : base;
};

/** The booking page with the top-up (a home visit: its pay panel) opened again. */
export const bookingTopupHref = (path: string, method?: ProviderId | null) =>
  `${path}${path.includes("?") ? "&" : "?"}topup=1${method ? `&method=${method}` : ""}`;
