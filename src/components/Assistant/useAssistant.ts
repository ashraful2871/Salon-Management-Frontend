"use client";

import { useCallback, useRef, useState } from "react";

import type {
  AssistantAction,
  AssistantMessage,
  AssistantState,
  AssistantTurn,
} from "@/lib/assistant-types";
import { getConversation } from "@/services/assistant/getConversation";
import { sendAssistantAction } from "@/services/assistant/sendAssistantAction";
import { confirmAssistantBooking } from "@/services/assistant/confirmAssistantBooking";
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
  restart: "Starting over…",
  back: "Going back…",
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

export type AssistantError = { message: string; retry: () => void };

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
  send: (action: AssistantAction, label?: string) => void;
  /** Post a signed quote and book. Not an action: it is the one call that
   *  commits, and a stale tab must not be able to replay it as one. */
  confirm: (confirmToken: string) => void;
  /** A confirm is in flight, so every Confirm button is inert. */
  confirming: boolean;
  /** The token whose card produced a booking; that card stays "Booked". */
  confirmedToken: string | null;
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
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  // A tap must not be able to open a second turn, and the dispatcher must never
  // read a conversation id one render out of date.
  const busy = useRef(false);
  const idRef = useRef<string | null>(null);

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
      if (label) {
        setMessages((prev) => [
          ...prev.filter((m) => !m.optimistic),
          {
            id: `optimistic-${Date.now()}`,
            role: "USER",
            text: label,
            createdAt: new Date().toISOString(),
            optimistic: true,
          },
        ]);
      }

      const id = idRef.current;

      try {
        const result =
          id && action
            ? await sendAssistantAction(id, action, label)
            : await startConversation(action ?? undefined, label);

        if (result.success && result.data) {
          apply(result.data, !id || !action);
        } else {
          setMessages((prev) => prev.filter((m) => !m.optimistic));
          setFailed({
            message: result.message || "That did not go through.",
            action,
            label,
          });
        }
      } catch (error) {
        setMessages((prev) => prev.filter((m) => !m.optimistic));
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
    [apply],
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

      setMessages((prev) => [
        ...prev.filter((m) => !m.optimistic),
        {
          id: `optimistic-${Date.now()}`,
          role: "USER",
          text: "Confirm booking",
          createdAt: new Date().toISOString(),
          optimistic: true,
        },
      ]);

      try {
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
        setMessages((prev) => prev.filter((m) => !m.optimistic));
        setFailed({
          message: result.message || "That did not go through.",
          action: null,
          label: undefined,
          confirmToken,
        });
      } catch (error) {
        setMessages((prev) => prev.filter((m) => !m.optimistic));
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
    [],
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
    void dispatch(failed.action, failed.label);
  }, [confirm, dispatch, failed]);

  return {
    conversationId,
    messages,
    state,
    pending: pendingAction !== null,
    pendingLabel: confirming
      ? "Booking your appointment…"
      : (pendingAction && WAITING_FOR[pendingAction.type]) || "Thinking…",
    error: failed ? { message: failed.message, retry } : null,
    open,
    send,
    confirm: (confirmToken: string) => {
      void confirm(confirmToken);
    },
    confirming,
    confirmedToken,
    reset,
  };
}
