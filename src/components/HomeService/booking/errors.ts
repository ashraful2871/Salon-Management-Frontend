import type { ApiResponse } from "@/lib/api-types";
import type { HomeErrorCode } from "@/services/home-service/types";

/** The booking flow's steps, in order. */
export type BookStep = "services" | "expert" | "date" | "time" | "address" | "review";

/** One friendly line per code; the server's own message is the fallback for anything else. */
export const HOME_ERROR_MESSAGE: Record<HomeErrorCode, string> = {
  HOME_SERVICE_CUSTOMER_ONLY: "Sign in with a customer account to book.",
  ACCOUNT_NOT_ACTIVE: "Your account can't book right now. Verify your email, or contact support.",
  PHONE_REQUIRED: "Add your mobile number so the expert can reach you.",
  OWN_SALON: "You can't book a home visit from a salon you work at.",
  PAYMENT_PENDING_EXISTS: "You have a booking waiting for payment. Pay for it or let it expire first.",
  TOO_MANY_ACTIVE: "You already have the most upcoming home visits allowed. Finish or cancel one first.",
  HOME_SERVICE_BLOCKED: "Home bookings are paused on your account after missed visits.",
  INVALID_CART: "Some of these services aren't offered any more. Pick them again.",
  AUDIENCE_MIXED: "Ladies and Gents services can't be booked in one visit.",
  HOME_SERVICE_UNAVAILABLE: "This salon isn't taking home bookings right now.",
  SALON_UNAVAILABLE: "This salon isn't taking bookings right now.",
  BELOW_MIN_ORDER: "Add a little more to reach this salon's minimum order.",
  VISIT_TOO_LONG: "That's too much for one visit. Remove a service or book two visits.",
  EXPERT_UNAVAILABLE: "This expert isn't taking home bookings right now. Try any available expert.",
  EXPERT_GENDER_MISMATCH: "This expert can't do this visit. Try any available expert.",
  EXPERT_CANNOT_DO_SERVICE: "This expert doesn't do one of these services. Try any available expert.",
  NO_EXPERT_FREE: "No expert is free at that time. Pick another time.",
  OUTSIDE_BOOKING_WINDOW: "That day can't be booked. Pick a day in the next week.",
  TOO_SOON: "That time is too soon for the expert to get to you. Pick a later time.",
  INVALID_TIME: "That time isn't offered. Pick another time.",
  SLOT_TAKEN: "Someone just took that time. Pick another one.",
  INVALID_LOCATION: "We couldn't read that location. Place the pin on the map again.",
  OUT_OF_SERVICE_AREA: "This address is outside the salon's service area. Move the pin or pick another expert.",
  RECIPIENT_CONFIRMATION_REQUIRED: "Ladies at Home is for women: tick that the service is for a woman.",
  PRICE_CHANGED: "The price changed. Please check the new total.",
  POLICY_NOT_ACCEPTED: "Please read and tick the cancellation rule first.",
  POLICY_CHANGED: "The cancellation rule changed — please read it again.",
  WALLET_FROZEN: "Your wallet is on hold. Contact support to book.",
  PAYMENT_EXPIRED: "The time to pay ran out. Book again.",
  INVALID_STATE: "This booking has moved on. Here is where it stands now.",
  RESCHEDULE_NOT_ALLOWED: "This visit can't be moved any more.",
  START_CODE_INVALID: "That code isn't right.",
  START_CODE_LOCKED: "Too many wrong codes.",
  ALREADY_REVIEWED: "You've already reviewed this visit.",
  HOME_SERVICE_OFF_CHECKLIST: "This salon isn't ready for home bookings yet.",
  TOO_MANY_REPORTS: "You've already reported this visit. Support will be in touch.",
  IMPERSONATION_READ_ONLY: "Read-only view: you can't book while viewing as this user.",
  STEP_UP_REQUIRED: "Please confirm it's you and try again.",
  APPROVAL_REQUIRED: "This needs a second approval.",
};

const isHomeCode = (code?: string): code is HomeErrorCode => !!code && code in HOME_ERROR_MESSAGE;

/** What to tell the customer about a failed home call. */
export const homeErrorMessage = (result: Pick<ApiResponse, "message" | "errorCode">) =>
  isHomeCode(result.errorCode) ? HOME_ERROR_MESSAGE[result.errorCode] : result.message || "Something went wrong. Please try again.";

/** The step a failed quote or create sends the customer back to; none = stay on review. */
export const STEP_FOR_CODE: Partial<Record<HomeErrorCode, BookStep>> = {
  INVALID_CART: "services",
  AUDIENCE_MIXED: "services",
  BELOW_MIN_ORDER: "services",
  VISIT_TOO_LONG: "services",
  EXPERT_UNAVAILABLE: "expert",
  EXPERT_GENDER_MISMATCH: "expert",
  EXPERT_CANNOT_DO_SERVICE: "expert",
  OUTSIDE_BOOKING_WINDOW: "date",
  NO_EXPERT_FREE: "time",
  TOO_SOON: "time",
  INVALID_TIME: "time",
  SLOT_TAKEN: "time",
  INVALID_LOCATION: "address",
  OUT_OF_SERVICE_AREA: "address",
  RECIPIENT_CONFIRMATION_REQUIRED: "address",
  PHONE_REQUIRED: "address",
};

export const stepForCode = (code?: string): BookStep | null => (isHomeCode(code) ? (STEP_FOR_CODE[code] ?? null) : null);

export const BOOK_STEP_KEYS: readonly BookStep[] = ["services", "expert", "date", "time", "address", "review"];
