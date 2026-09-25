"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AssistantAction,
  AssistantMessage,
  AssistantState,
  AssistantTurn,
} from "@/lib/assistant-types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { checkAssistantPayment } from "@/services/assistant/checkAssistantPayment";
import { getConversation } from "@/services/assistant/getConversation";
import { sendAssistantAction } from "@/services/assistant/sendAssistantAction";
import { sendAssistantMessage } from "@/services/assistant/sendAssistantMessage";
import { confirmAssistantBooking } from "@/services/assistant/confirmAssistantBooking";
import { startAssistantTopup } from "@/services/assistant/startAssistantTopup";
import { startConversation } from "@/services/assistant/startConversation";

/** Survives a navigation inside the site, not a new tab: one chat per tab is
 *  what a customer expects, and a guest's claim to it lives in `sm_chat`. */
const CONVERSATION_KEY = "sm_chat_id";

const GREETING: AssistantState = { step: "greeting" };

/**
 * A blank wait feels broken, so the typing indicator says what is happening.
 * Keyed by the action that is in flight, not by the step, because the step has
 * not moved yet.
 */
const WAITING_FOR: Partial<Record<AssistantAction["type"], string>> = {
  start: "Starting up…",
  find_nearby: "Looking for salons near you…",
  set_location: "Looking for salons near you…",
  change_location: "One moment…",
  search_salons: "Searching salons…",
  choose_salon: "Opening the salon…",
  book: "Checking availability…",
  show_services: "Loading services…",
  choose_date: "Checking availability…",
  choose_service: "Checking availability…",
  choose_counter: "Checking availability…",
  choose_slot: "Putting your booking together…",
  change: "One moment…",
  wallet: "Checking your wallet…",
  check_payment: "Checking your payment…",
  restart: "Starting over…",
  back: "Going back…",
};

/**
 * A typed message has no action to name what is in flight, and the reply is
 * not streamed, so the label is a guess from where the customer is — replaced
 * by the tool the server last reported running at this same step, when there
 * is one.
 */
const TYPING_FOR: Partial<Record<AssistantState["step"], string>> = {
  greeting: "Searching salons…",
  discover: "Searching salons…",
  salon: "Checking availability…",
  date: "Checking availability…",
  service: "Checking availability…",
  counter: "Checking availability…",
  slot: "Checking availability…",
};

const readStoredId = (): string | null => {
  try {
    return window.sessionStorage.getItem(CONVERSATION_KEY);
  } catch {
    // Private mode, or storage blocked. The chat still works, it just will not
    // survive a reload.
    return null;
  }
};

const writeStoredId = (id: string | null) => {
  try {
    if (id) window.sessionStorage.setItem(CONVERSATION_KEY, id);
    else window.sessionStorage.removeItem(CONVERSATION_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * A tab opened inside the tap itself. A window opened after a round trip is a
 * popup to Safari (and to Chrome once the gateway takes a few seconds), so the
 * tab is opened first and pointed at the gateway when the URL arrives. Null on
 * a phone, or when the browser blocked it anyway — then the page itself goes.
 */
const openPaymentTab = (): Window | null => {
  const tab = window.open("", "_blank");
  if (!tab) return null;

  try {
    tab.document.title = "Opening payment…";
    tab.document.body.textContent = "Opening the payment page…";
  } catch {
    /* cosmetic */
  }

  return tab;
};

export type AssistantError = { message: string; retry: () => void };

type TopupRequest = { amountMinor: number; autoConfirm: boolean; label: string };

export type AssistantController = {
  conversationId: string | null;
  messages: AssistantMessage[];
  state: AssistantState;
  pending: boolean;
  /** What the assistant is busy doing, for the typing indicator. */
  pendingLabel: string;
  error: AssistantError | null;
  /** Start or resume the chat. Safe to call on every open. */
  open: (action?: AssistantAction, label?: string) => void;
  /** Coming back from the gateway: reopen this chat (from `sm_chat_resume`
   *  when this tab has none of its own) and ask about the payment once. */
  resume: (conversationId?: string | null) => void;
  send: (action: AssistantAction, label?: string) => void;
  /** Free text, read by the API into the same actions a tap sends. */
  sendText: (text: string) => void;
  /** How the last typed message was answered: "guided" means no model was
   *  involved (off, over budget, or down). Null until something is typed. */
  mode: "guided" | "ai" | null;
  /** Post a signed quote and book. Not an action: it is the one call that
   *  commits, and a stale tab must not be able to replay it as one. */
  confirm: (confirmToken: string) => void;
  /** A confirm is in flight, so every Confirm button is inert. */
  confirming: boolean;
  /** The token whose card produced a booking; that card stays "Booked". */
  confirmedToken: string | null;
  /** Open the gateway for a wallet top-up. Must be called from the tap
   *  itself: it opens the payment tab before its first await. */
  topup: (amountMinor: number, autoConfirm: boolean, label: string) => void;
  toppingUp: boolean;
  /** A background `check_payment`: draws only what the server wrote. */
  checkPayment: () => void;
  checkingPayment: boolean;
  /** Throw the transcript away and greet again. */
  reset: () => void;
};

export function useAssistant(): AssistantController {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [state, setState] = useState<AssistantState>(GREETING);
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(
    null,
  );
  const [failed, setFailed] = useState<{
    message: string;
    action: AssistantAction | null;
    label?: string;
    /** Set when it was a confirm that failed, so "Try again" retries the
     *  booking rather than the last guided tap. */
    confirmToken?: string;
    /** Set when it was opening a top-up that failed. */
    topup?: TopupRequest;
    /** Set when it was a typed message that failed. */
    text?: string;
  } | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [mode, setMode] = useState<"guided" | "ai" | null>(null);
  // The last tool the server said it ran, and at which step.
  const [lastTool, setLastTool] = useState<{
    step: AssistantState["step"];
    label: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // A tap must not be able to open a second turn, and the dispatcher must never
  // read a conversation id one render out of date.
  const busy = useRef(false);
  const idRef = useRef<string | null>(null);
  // The background payment check in flight. A tap waits for it rather than
  // being dropped, so the two never race each other on the server.
  const pollRef = useRef<Promise<void> | null>(null);
  // Set by `resume`: ask about the payment once the conversation is loaded.
  const resumeCheck = useRef(false);

  const apply = useCallback((turn: AssistantTurn, replace: boolean) => {
    idRef.current = turn.conversationId;
    setConversationId(turn.conversationId);
    writeStoredId(turn.conversationId);
    setState(turn.state ?? GREETING);
    setMessages((prev) =>
      replace
        ? turn.messages
        : // Drop the optimistic bubble: the server's own pair replaces it.
          [...prev.filter((m) => !m.optimistic), ...turn.messages],
    );
  }, []);

  const showOptimistic = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev.filter((m) => !m.optimistic),
      {
        id: `optimistic-${Date.now()}`,
        role: "USER",
        text,
        createdAt: new Date().toISOString(),
        optimistic: true,
      },
    ]);
  }, []);

  const dropOptimistic = useCallback(() => {
    setMessages((prev) => prev.filter((m) => !m.optimistic));
  }, []);

  /**
   * One turn, start to finish. `action === null` means "open a chat", which the
   * service turns into the greeting or, when the navbar already knows where the
   * customer is, into salons near them.
   */
  const dispatch = useCallback(
    async (action: AssistantAction | null, label?: string) => {
      if (busy.current) return;
      busy.current = true;

      setPendingAction(action ?? { type: "start" });
      setFailed(null);

      // The bubble goes up before the await: on a slow connection the tap has
      // to feel like it landed.
      if (label) showOptimistic(label);

      try {
        await pollRef.current;

        const id = idRef.current;
        const result =
          id && action?.type === "check_payment"
            ? await checkAssistantPayment(id, label)
            : id && action
              ? await sendAssistantAction(id, action, label)
              : await startConversation(action ?? undefined, label);

        if (result.success && result.data) {
          apply(result.data, !id || !action);
        } else {
          dropOptimistic();
          setFailed({
            message: result.message || "That did not go through.",
            action,
            label,
          });
        }
      } catch (error) {
        dropOptimistic();
        setFailed({
          message:
            error instanceof Error ? error.message : "That did not go through.",
          action,
          label,
        });
      } finally {
        busy.current = false;
        setPendingAction(null);
      }
    },
    [apply, dropOptimistic, showOptimistic],
  );

  /** Resume the chat this tab was already having, or open a new one. */
  const open = useCallback(
    (action?: AssistantAction, label?: string) => {
      if (busy.current) return;

      if (idRef.current) {
        if (action) void dispatch(action, label);
        return;
      }

      const stored = readStoredId();
      if (!stored) {
        void dispatch(action ?? null, label);
        return;
      }

      busy.current = true;
      setPendingAction({ type: "start" });

      void (async () => {
        const result = await getConversation(stored);
        busy.current = false;
        setPendingAction(null);

        if (result.success && result.data) {
          apply(result.data, true);
          if (action) void dispatch(action, label);
          return;
        }

        // Expired, swept, or claimed by another account. A fresh greeting beats
        // an error the customer can do nothing about.
        writeStoredId(null);
        void dispatch(action ?? null, label);
      })();
    },
    [apply, dispatch],
  );

  const send = useCallback(
    (action: AssistantAction, label?: string) => {
      void dispatch(action, label);
    },
    [dispatch],
  );

  /**
   * A typed message. Same single-flight guard and optimistic bubble as a tap;
   * a chat that has not started yet is started first, so typing into a fresh
   * panel works too.
   */
  const sendText = useCallback(
    async (text: string) => {
      if (busy.current) return;
      busy.current = true;

      setPendingText(text);
      setFailed(null);
      showOptimistic(text);

      try {
        await pollRef.current;

        let id = idRef.current;
        if (!id) {
          const started = await startConversation();
          if (started.success && started.data) {
            apply(started.data, true);
            showOptimistic(text);
            id = started.data.conversationId;
          }
        }
        if (!id) throw new Error("The chat did not start.");

        const result = await sendAssistantMessage(id, text);

        if (result.success && result.data) {
          apply(result.data, false);
          setMode(result.data.mode ?? "guided");
          const toolLabel = result.data.toolLabel;
          setLastTool(
            toolLabel
              ? { step: result.data.state?.step ?? "greeting", label: toolLabel }
              : null,
          );
        } else {
          dropOptimistic();
          setFailed({
            message: result.message || "That did not go through.",
            action: null,
            text,
          });
        }
      } catch (error) {
        dropOptimistic();
        setFailed({
          message:
            error instanceof Error ? error.message : "That did not go through.",
          action: null,
          text,
        });
      } finally {
        busy.current = false;
        setPendingText(null);
      }
    },
    [apply, dropOptimistic, showOptimistic],
  );

  /**
   * The background check. Skipped while a tap is in flight — that tap's answer
   * is the fresher one. A payment still pending comes back unrecorded and is
   * not drawn; anything the server wrote is appended, ahead of a tap that
   * started meanwhile.
   */
  const checkPayment = useCallback(() => {
    const id = idRef.current;
    if (!id || busy.current || pollRef.current) return;

    setCheckingPayment(true);

    pollRef.current = (async () => {
      try {
        const result = await checkAssistantPayment(id);
        const data = result.data;
        if (!result.success || !data) return;

        if (data.recorded) {
          setState(data.state ?? GREETING);
          setMessages((prev) => [
            ...prev.filter((m) => !m.optimistic),
            ...data.messages,
            ...prev.filter((m) => m.optimistic),
          ]);
        } else if (!data.state?.pendingTopup) {
          // Settled in another tab: stop watching, the transcript is theirs.
          setState((prev) => {
            const next = { ...prev };
            delete next.pendingTopup;
            return next;
          });
        }
      } catch {
        // A missed poll is not worth a banner; the next one, or the customer's
        // own "Check again", will ask again.
      } finally {
        pollRef.current = null;
        setCheckingPayment(false);
      }
    })();
  }, []);

  const resume = useCallback(
    (resumeId?: string | null) => {
      if (idRef.current) {
        checkPayment();
        return;
      }
      // A new tab (the desktop gateway opened one) has no sessionStorage of
      // its own; the cookie's id is this customer's chat. The API still checks
      // it is theirs.
      if (resumeId && !readStoredId()) writeStoredId(resumeId);
      resumeCheck.current = true;
      open();
    },
    [checkPayment, open],
  );

  useEffect(() => {
    if (!conversationId || !resumeCheck.current) return;
    resumeCheck.current = false;
    checkPayment();
  }, [conversationId, checkPayment]);

  /**
   * The booking. The server writes both transcript messages itself, so what
   * comes back is one turn's worth of blocks to append — on success and on a
   * recoverable failure alike, which is why a 409 renders a fresh slot list
   * rather than an error banner.
   */
  const confirm = useCallback(
    async (confirmToken: string) => {
      // Two guards, because a double tap is the normal way this goes wrong:
      // the ref blocks the second call synchronously, and the button is
      // disabled off `confirming` for the rest of the round trip.
      if (busy.current) return;
      busy.current = true;

      setConfirming(true);
      setPendingAction({ type: "choose_slot", slotId: "" });
      setFailed(null);
      showOptimistic("Confirm booking");

      try {
        await pollRef.current;

        const result = await confirmAssistantBooking(confirmToken);
        const data = result.data;

        if (data) {
          if (result.success) setConfirmedToken(confirmToken);

          idRef.current = data.conversationId ?? idRef.current;
          setState(data.state ?? GREETING);
          setMessages((prev) => [
            ...prev.filter((m) => !m.optimistic),
            {
              id: `confirm-${Date.now()}`,
              role: "ASSISTANT",
              text: data.text ?? result.message ?? null,
              blocks: data.blocks ?? null,
              createdAt: new Date().toISOString(),
            },
          ]);
          return;
        }

        // No blocks came back, so there is nothing to draw but the message.
        dropOptimistic();
        setFailed({
          message: result.message || "That did not go through.",
          action: null,
          label: undefined,
          confirmToken,
        });
      } catch (error) {
        dropOptimistic();
        setFailed({
          message:
            error instanceof Error ? error.message : "That did not go through.",
          action: null,
          label: undefined,
          confirmToken,
        });
      } finally {
        busy.current = false;
        setConfirming(false);
        setPendingAction(null);
      }
    },
    [dropOptimistic, showOptimistic],
  );

  /**
   * Out to the gateway. Desktop keeps the chat in this tab and pays in a new
   * one; a phone leaves for the gateway and comes back through the wallet
   * result page's "Back to your booking" (the `sm_chat_resume` cookie set by
   * the server action). The API answers a double tap on the same amount with
   * the payment it already opened, so one tap is one intent.
   */
  const topup = useCallback(
    (amountMinor: number, autoConfirm: boolean, label: string) => {
      const id = idRef.current;
      if (!id || busy.current) return;
      busy.current = true;

      // Before any await — see `openPaymentTab`.
      const tab = isDesktop ? openPaymentTab() : null;

      setToppingUp(true);
      setFailed(null);
      showOptimistic(label);

      void (async () => {
        const fail = (message: string) => {
          tab?.close();
          dropOptimistic();
          setFailed({
            message,
            action: null,
            topup: { amountMinor, autoConfirm, label },
          });
        };

        try {
          await pollRef.current;

          const result = await startAssistantTopup(
            id,
            amountMinor,
            autoConfirm,
            label,
          );
          const data = result.data;

          if (!data) {
            fail(result.message || "The payment page did not open.");
            return;
          }

          // Started or not, the server wrote a turn: "Opening the payment
          // page…", or the time being gone with what is free instead.
          apply(data, false);

          if (!result.success || !data.redirectUrl) {
            tab?.close();
            return;
          }

          if (tab) {
            // What `noopener` would have done: the gateway page gets no handle
            // back into this one.
            tab.opener = null;
            tab.location.href = data.redirectUrl;
          } else {
            window.location.href = data.redirectUrl;
          }
        } catch (error) {
          fail(
            error instanceof Error
              ? error.message
              : "The payment page did not open.",
          );
        } finally {
          busy.current = false;
          setToppingUp(false);
        }
      })();
    },
    [apply, dropOptimistic, isDesktop, showOptimistic],
  );

  const reset = useCallback(() => {
    if (busy.current) return;
    idRef.current = null;
    setConversationId(null);
    writeStoredId(null);
    setMessages([]);
    setState(GREETING);
    setFailed(null);
    setConfirmedToken(null);
    setMode(null);
    setLastTool(null);
    void dispatch(null);
  }, [dispatch]);

  const retry = useCallback(() => {
    if (!failed) return;
    // A retried confirm reuses the same token but gets a *fresh*
    // Idempotency-Key from the server action, so if the first attempt actually
    // landed, the slot claim is what stops a second booking — not this.
    if (failed.confirmToken) {
      void confirm(failed.confirmToken);
      return;
    }
    // "Try again" is itself a tap, so the payment tab can open inside it.
    if (failed.topup) {
      topup(failed.topup.amountMinor, failed.topup.autoConfirm, failed.topup.label);
      return;
    }
    if (failed.text) {
      void sendText(failed.text);
      return;
    }
    void dispatch(failed.action, failed.label);
  }, [confirm, dispatch, failed, sendText, topup]);

  return {
    conversationId,
    messages,
    state,
    pending: pendingAction !== null || toppingUp || pendingText !== null,
    pendingLabel: confirming
      ? "Booking your appointment…"
      : toppingUp
        ? "Opening the payment page…"
        : pendingText !== null
          ? (lastTool?.step === state.step
              ? lastTool.label
              : TYPING_FOR[state.step]) || "Thinking…"
          : (pendingAction && WAITING_FOR[pendingAction.type]) || "Thinking…",
    error: failed ? { message: failed.message, retry } : null,
    open,
    resume,
    send,
    sendText: (text: string) => {
      void sendText(text);
    },
    mode,
    confirm: (confirmToken: string) => {
      void confirm(confirmToken);
    },
    confirming,
    confirmedToken,
    topup,
    toppingUp,
    checkPayment,
    checkingPayment,
    reset,
  };
}
