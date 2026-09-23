// The assistant's wire format, mirrored by hand from the API's
// `assistant.actions.ts` / `assistant.blocks.ts` / `assistant.state.ts`.
//
// Two rules keep this file honest:
//   * money keeps its `Minor` suffix (integer poisha); the taka twin that
//     `addTakaFields` adds on the way out is declared optional, because it is
//     generated, never sent by a handler, and must never be formatted with
//     `formatBDT`.
//   * the `Block` union is open in practice - the renderer's `default` returns
//     null - so a backend that ships a new block before this file knows it
//     degrades to silence rather than a crash.

/* --------------------------------------------------------------- actions */

export type ChangeTarget = "salon" | "date" | "service" | "counter" | "slot";

export type AssistantAction =
  | { type: "start" }
  | { type: "find_nearby"; page?: number }
  | { type: "set_location"; lat: number; lng: number; label?: string }
  // `filters` is what the API read a typed message as; the client never builds
  // one, only posts back the "Show more" action it was given.
  | { type: "search_salons"; query: string; page?: number; filters?: Record<string, unknown> }
  | { type: "choose_salon"; salonId: string }
  | { type: "change_location" }
  | { type: "book" }
  | { type: "show_services" }
  | { type: "choose_date"; date: string }
  | { type: "choose_service"; serviceId: string }
  | { type: "choose_counter"; counterId: string }
  | { type: "choose_slot"; slotId: string }
  | { type: "change"; target: ChangeTarget }
  | { type: "wallet" }
  /** "Has my top-up landed?" Safe to send any time; answers with the wallet
   *  when no top-up is in flight. */
  | { type: "check_payment" }
  | { type: "restart" }
  | { type: "back" }
  // Managing bookings that already exist. Cancel is two taps on purpose:
  // `cancel_booking` only shows what it would cost.
  | { type: "my_bookings"; scope?: "upcoming" | "past" }
  | { type: "cancel_booking"; appointmentId: string }
  | { type: "cancel_confirm"; appointmentId: string }
  | { type: "reschedule"; appointmentId: string }
  | { type: "book_usual"; appointmentId: string }
  | { type: "rate_booking"; appointmentId: string; rating: number };

/* ---------------------------------------------------------------- pieces */

/** `icon` is a name ("map-pin", "scissors", "wallet", "calendar"), never
 *  markup - `Chip` maps it to a Lucide icon and ignores anything unknown. */
export type QuickReply = {
  label: string;
  action: AssistantAction;
  style?: "primary" | "ghost";
  icon?: string;
};

export type AssistantSalonCard = {
  id: string;
  name: string;
  area: string;
  city: string;
  image: string | null;
  rating: number;
  totalReviews: number;
  /** null when we have no location to measure from. */
  distanceMeters: number | null;
  /** Cheapest active service; null when the salon lists none. */
  priceFromMinor: number | null;
  priceFrom?: number;
  /** null when the salon has not published hours - unknown is not closed. */
  openNow: boolean | null;
  serviceCount: number;
  counterCount: number;
  /** Why this salon is in the list - "1.2 km away", "Open now", "From ৳120". */
  reasons: string[];
};

export type SalonPolicy = {
  depositMinor: number;
  deposit?: number;
  depositPercent: number | null;
  cancellationWindowMin: number;
  phone: string;
  address: string;
};

export type DateOption = { date: string; label: string; slotCount: number };

export type ServiceOption = {
  id: string;
  name: string;
  category: string;
  priceMinor: number;
  price?: number;
  /** Minutes. */
  duration: number;
  depositMinor: number;
  deposit?: number;
  slotCount: number;
};

export type CounterOption = {
  id: string;
  name: string;
  code: string | null;
  slotCount: number;
};

export type SlotChoice = {
  id: string;
  startTime: string;
  endTime: string | null;
  counterId: string | null;
  counterName: string | null;
};

export type SlotGroup = { label: string; slots: SlotChoice[] };

export type SummarySalon = {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
};

export type SummaryService = {
  id: string;
  name: string;
  category: string;
  priceMinor: number;
  price?: number;
  duration: number;
};

export type SummaryCounter = { id: string; name: string; code: string | null };

/** The booking a summary is moving, and what cancelling it costs now. */
export type RescheduleInfo = {
  appointmentId: string;
  /** "Thu 24 Sep 17:45" */
  label: string;
  date: string;
  startTime: string;
  penaltyMinor: number;
  depositMinor: number;
  freeCancellation: boolean;
};

export type BookingListItem = {
  id: string;
  salonId: string;
  salonName: string;
  salonPhone: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string | null;
  status: string;
  token: string | null;
  serialNumber: number | null;
  counterName: string | null;
  totalMinor: number;
  depositMinor: number;
  dueAtSalonMinor: number;
  canCancel: boolean;
  canReschedule: boolean;
  actions: QuickReply[];
};

/* ---------------------------------------------------------------- blocks */

export type Block =
  | { type: "quick_replies"; options: QuickReply[] }
  | { type: "location_request"; reason: string; canSkip: boolean }
  | {
      type: "salon_carousel";
      salons: AssistantSalonCard[];
      nextPage?: AssistantAction;
    }
  | {
      type: "salon_details";
      salon: AssistantSalonCard;
      policy: SalonPolicy;
      actions: QuickReply[];
    }
  | { type: "notice"; tone: "info" | "warn" | "error"; text: string }
  | { type: "login_required"; reason: string; returnPath: string }
  | {
      type: "wallet_status";
      signedIn: boolean;
      isFrozen: boolean;
      availableMinor: number;
      available?: number;
      heldMinor: number;
      held?: number;
      /** The cheapest deposit this salon could ask for. Zero on the standalone
       *  "My wallet" chip, where no booking is in play. */
      depositFromMinor: number;
      depositFrom?: number;
      shortfallMinor: number;
      shortfall?: number;
      suggestedTopupMinor: number;
      suggestedTopup?: number;
      minTopupMinor: number;
      minTopup?: number;
      note: string;
    }
  | {
      type: "date_picker";
      salonId: string;
      serviceId: string | null;
      dates: DateOption[];
    }
  | {
      type: "service_picker";
      salonId: string;
      date: string | null;
      services: ServiceOption[];
    }
  | { type: "counter_picker"; counters: CounterOption[] }
  | {
      type: "slot_picker";
      date: string;
      /** Named once at the top when a single counter is in play; null when the
       *  times come from several, and then each slot names its own. */
      counterName: string | null;
      groups: SlotGroup[];
      /** The band a typed "evening" / "bikele" asked for: scrolled to and
       *  highlighted. Every band is still shown. */
      focus?: "Morning" | "Afternoon" | "Evening" | null;
      /** "after 5" ("HH:mm"): earlier times are dimmed, not hidden. */
      after?: string | null;
    }
  | {
      type: "booking_summary";
      salon: SummarySalon;
      service: SummaryService;
      counter: SummaryCounter;
      staff: { id: string; name: string } | null;
      slot: {
        id: string;
        date: string;
        startTime: string;
        endTime: string | null;
      };
      priceMinor: number;
      price?: number;
      depositMinor: number;
      deposit?: number;
      dueAtSalonMinor: number;
      dueAtSalon?: number;
      /** ISO instant, or null when free cancellation has already lapsed. */
      freeCancellationUntil: string | null;
      cancellationWindowMin: number;
      wallet: {
        signedIn: boolean;
        availableMinor: number;
        available?: number;
        shortfallMinor: number;
        shortfall?: number;
      };
      /** The existing review page, pre-filled. Relative to this origin. */
      handoffUrl: string;
      /** True once the slot is held for this customer and the server has signed
       *  a quote. Guests get false and the handoff link instead. */
      canConfirmInChat: boolean;
      /** The signed quote to post back to `/assistant/bookings/confirm`. */
      confirmToken?: string;
      /** ISO instant the hold lapses; drives the countdown on the button. */
      holdExpiresAt?: string;
      /** Present when this summary moves an existing booking. */
      reschedule?: RescheduleInfo;
    }
  | {
      type: "booking_list";
      scope: "upcoming" | "past";
      bookings: BookingListItem[];
    }
  | {
      type: "cancellation_preview";
      appointmentId: string;
      startsAt: string;
      freeCancellation: boolean;
      cancellationWindowMin: number;
      depositMinor: number;
      penaltyMinor: number;
      penaltyPercent: number;
      refundMinor: number;
      cancellable: boolean;
      salonName: string;
      salonPhone: string;
      serviceName: string;
      date: string;
      startTime: string;
      actions: QuickReply[];
    }
  | {
      type: "booking_confirmed";
      appointmentId: string;
      /** The short code the counter asks for; null on the oldest rows. */
      token: string | null;
      serialNumber: number | null;
      salonName: string;
      salonAddress: string;
      salonPhone: string;
      serviceName: string;
      date: string;
      startTime: string;
      endTime: string | null;
      counterName: string | null;
      staffName: string | null;
      totalMinor: number;
      total?: number;
      depositMinor: number;
      deposit?: number;
      dueAtSalonMinor: number;
      dueAtSalon?: number;
      /** ISO instant, or null when the window has already closed. */
      freeCancellationUntil: string | null;
      /** Directions; null when the salon has no coordinates. */
      mapUrl: string | null;
      manageUrl: string;
    }
  | {
      /** The in-chat top-up. Its buttons call `startAssistantTopup`, not an
       *  action: money is never something a replayed tap can start. */
      type: "payment_prompt";
      /** Zero when no booking is in play (the "My wallet" chip). */
      shortfallMinor: number;
      shortfall?: number;
      suggestedTopupMinor: number;
      suggestedTopup?: number;
      minTopupMinor: number;
      minTopup?: number;
      /** Poisha, ascending; every one covers the shortfall. */
      presets: number[];
      /** Display only - the gateway page is where one is chosen. */
      methods: string[];
      /** Offer "Top up & book": a held summary is behind this prompt. */
      canAutoConfirm: boolean;
    };

export type BlockType = Block["type"];

/* ----------------------------------------------------------------- state */

export const ASSISTANT_STEPS = [
  "greeting",
  "discover",
  "salon",
  "date",
  "service",
  "counter",
  "slot",
  "summary",
  "payment",
  "booked",
] as const;

export type AssistantStep = (typeof ASSISTANT_STEPS)[number];

export type AssistantState = {
  step: AssistantStep;
  salonId?: string;
  serviceId?: string;
  date?: string;
  counterId?: string;
  slotId?: string;
  staffId?: string;
  location?: { lat: number; lng: number; label: string };
  lastQuery?: string;
  /** The booking this chat produced, keyed by the Idempotency-Key that made
   *  it. Server-written; the client only reads it to know it is done. */
  confirm?: { key: string; appointmentId: string };
  /** Server-side copy of the summary's quote; the client never sends it. */
  quoteToken?: string;
  holdExtended?: boolean;
  /** The booking this funnel is moving (Reschedule). */
  rescheduleOf?: string;
  /** A top-up this chat opened and has not seen settle. While it is set the
   *  panel watches for the payment. */
  pendingTopup?: PendingTopup;
};

export type PendingTopup = {
  transactionId: string;
  amountMinor: number;
  /** "Top up & book": the booking completes by itself when the money lands. */
  autoConfirm: boolean;
  confirmToken?: string;
  redirectUrl?: string;
  /** ISO instant. */
  startedAt: string;
};

/* -------------------------------------------------------------- messages */

export type AssistantRole = "USER" | "ASSISTANT" | "TOOL";

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  text: string | null;
  blocks?: Block[] | null;
  action?: AssistantAction | null;
  createdAt: string;
  /** 👍 1 / 👎 -1, once the customer has rated this message. */
  feedback?: number | null;
  /** Client-only: an optimistic bubble that has not been acknowledged yet. */
  optimistic?: boolean;
};

/**
 * What `POST /assistant/bookings/confirm` answers with, on success *and* on a
 * recoverable failure: the same `text` + `blocks` a guided turn carries, plus
 * the appointment when there is one. The two messages are written into the
 * transcript server-side, so the client appends these blocks itself rather
 * than getting a message pair back.
 */
export type AssistantConfirmResult = {
  conversationId: string;
  appointment?: { id: string; token?: string | null } | null;
  state: AssistantState;
  blocks: Block[];
  text: string;
};

export type AssistantTurn = {
  conversationId: string;
  /** Returned once, on create, for a guest. The Next.js server keeps it in the
   *  httpOnly `sm_chat` cookie; it never reaches the browser. */
  anonymousId?: string | null;
  state: AssistantState;
  messages: AssistantMessage[];
  /** Typed turns only: "guided" when the rules answered without a model. */
  mode?: "guided" | "ai";
  /** Typed turns only: what the last tool the model ran was doing. */
  toolLabel?: string;
};

export type TopupIntentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * A `check_payment` answer. `recorded: false` is a background poll that found
 * the payment still pending: the server wrote nothing, so the client draws
 * nothing either.
 */
export type AssistantPaymentCheck = AssistantTurn & {
  recorded: boolean;
  payment: { transactionId: string; status: TopupIntentStatus } | null;
  /** Set when the payment landing also booked ("Top up & book"). */
  appointmentId?: string;
};

/**
 * `POST /assistant/payments/topup`. Started: the gateway URL plus the turn it
 * wrote ("Opening the payment page…"). Not started (409, "Top up & book" found
 * the time gone): only the turn, which shows what is free instead.
 */
export type AssistantTopupResult = AssistantTurn & {
  started: boolean;
  redirectUrl?: string;
  transactionId?: string;
  amountMinor?: number;
  autoConfirm?: boolean;
};
