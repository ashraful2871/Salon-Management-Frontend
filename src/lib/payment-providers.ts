/**
 * The gateways a wallet top-up can go through. Mirrors the backend's
 * `PaymentProvider` ids; which of them are switched on comes from
 * `GET /payments/methods` at request time, never from here.
 */
export type ProviderId = "BKASH" | "SSLCOMMERZ";

export const providerLabel = (id?: string | null) =>
  id === "BKASH" ? "bKash" : id === "SSLCOMMERZ" ? "SSLCommerz" : id || "Online payment";

/** What the gateway calls its own receipt number: the one its support desk asks for. */
export const gatewayRefLabel = (id?: string | null) =>
  id === "BKASH" ? "bKash TrxID" : "Gateway reference";

export const BKASH_PINK = "#E2136E";

/** localStorage key for the method the customer last paid with. */
export const TOPUP_METHOD_KEY = "sm_topup_method";
