/**
 * The payment methods the checkout offers.
 *
 * Only one is live today: the SalonKhuji Wallet, which is what the booking API
 * actually settles against - `POST /appointments` holds the deposit on the
 * customer's wallet inside the booking transaction and has no notion of any
 * other tender. Everything else here is declared but disabled, so the checkout
 * shows the roadmap without pretending to take money it cannot take.
 *
 * To turn a method on: flip `status` to "AVAILABLE" once the backend can settle
 * it, and teach the confirm handler in `BookingSummary.tsx` what to send.
 */
export type PaymentMethodStatus = "AVAILABLE" | "COMING_SOON";

export type PaymentMethod = {
  id: string;
  /** What the customer sees. */
  name: string;
  /** One line under the name. */
  description: string;
  /** Small print shown when the method is selected. */
  detail?: string;
  status: PaymentMethodStatus;
  /** Rendered as a small tag on the right of the row. */
  tag?: string;
};

export const WALLET_METHOD_ID = "SALON_WALLET";

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: WALLET_METHOD_ID,
    name: "SalonKhuji Wallet",
    description: "Pay the reservation deposit from your wallet balance",
    detail:
      "The deposit is held, not spent. It comes off your bill when you turn up, and is returned in full if you cancel in time.",
    status: "AVAILABLE",
    tag: "Instant",
  },
  {
    id: "CARD",
    name: "Credit / Debit Card",
    description: "Visa, Mastercard, American Express",
    status: "COMING_SOON",
    tag: "Coming soon",
  },
  {
    id: "MOBILE_BANKING",
    name: "Mobile Banking",
    description: "bKash, Nagad, Rocket, Upay",
    status: "COMING_SOON",
    tag: "Coming soon",
  },
  {
    id: "PAY_AT_SALON",
    name: "Pay at the Salon",
    description: "Settle the whole bill at the counter, no deposit",
    status: "COMING_SOON",
    tag: "Coming soon",
  },
];

/** The single line shown under the disabled rows. */
export const COMING_SOON_NOTICE =
  "Other payment methods are coming soon. For now, bookings are secured with your SalonKhuji Wallet balance.";
