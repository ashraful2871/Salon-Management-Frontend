"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  ArrowDown,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useAssistantChat } from "./AssistantContext";
import AssistantMessages from "./AssistantMessages";
import Chip from "./Chip";
import type { SendAction } from "./block-props";

type AssistantPanelProps = {
  /** `overlay` is the floating panel / bottom sheet; `page` is the same chat
   *  filling `/assistant`, where it is content rather than a dialog. */
  variant?: "overlay" | "page";
  /** `/assistant?resume=1`, the way back from the wallet result page: reopen
   *  the chat and ask about the payment once. Page variant only. */
  resume?: boolean;
  /** From the `sm_chat_resume` cookie, for a tab with no chat of its own. */
  resumeId?: string | null;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** How a top-up is watched: from the moment the customer is back (window
 *  focus), every few seconds, for a few minutes — then a "Check again" tap. The
 *  IPN and the reconciliation sweep settle the payment whether anyone watches
 *  or not; this only decides when the chat finds out. */
const POLL_EVERY_MS = 5_000;
const POLL_FOR_MS = 3 * 60_000;

const AssistantPanel = ({
  variant = "overlay",
  resume = false,
  resumeId = null,
}: AssistantPanelProps) => {
  const { chat, close } = useAssistantChat();
  const {
    messages,
    state,
    pending,
    pendingLabel,
    error,
    send,
    confirm,
    confirming,
    confirmedToken,
    topup,
    toppingUp,
    checkPayment,
    checkingPayment,
    reset,
    open,
  } = chat;

  const headingId = useId();
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether the transcript is parked at the bottom. A ref, not state, so the
  // scroll effect does not re-run every time it flips.
  const atBottomRef = useRef(true);
  // A smooth scroll fires scroll events all the way down, every one of them
  // reading as "not at the bottom" until it lands. Without this the widget
  // announces a new message the customer is already looking at.
  const autoScrollUntil = useRef(0);
  const [unseen, setUnseen] = useState(false);
  const [draft, setDraft] = useState("");

  const isOverlay = variant === "overlay";

  /* --------------------------------------------------------- transcript */

  const scrollToBottom = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current;
      if (!el) return;
      const animated = smooth && !reduceMotion;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: animated ? "smooth" : "auto",
      });
      autoScrollUntil.current = animated ? Date.now() + 2000 : 0;
      atBottomRef.current = true;
      setUnseen(false);
    },
    [reduceMotion],
  );

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 56;

    // Mid-flight frames of our own smooth scroll are not the customer reading
    // back through the transcript. The window closes the moment it lands, or
    // the moment a real gesture arrives.
    if (!atBottom && Date.now() < autoScrollUntil.current) return;

    autoScrollUntil.current = 0;
    atBottomRef.current = atBottom;
    if (atBottom) setUnseen(false);
  };

  // A wheel, a swipe or a key is the customer taking over; a programmatic
  // scroll fires none of them.
  const handleUserScroll = () => {
    autoScrollUntil.current = 0;
  };

  // Follow the newest message, unless the customer has scrolled up to read
  // something - then say so instead of yanking the view away.
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom(true);
    else if (messages.length > 0) setUnseen(true);
  }, [messages, pending, scrollToBottom]);

  /* ------------------------------------------------------------ opening */

  // The overlay is opened by whoever mounted it; the page has to ask itself.
  useEffect(() => {
    if (isOverlay) return;
    if (resume) chat.resume(resumeId);
    else open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------ watching a top-up */

  const pendingTopup = state.pendingTopup;
  const watchedId = pendingTopup?.transactionId ?? null;
  // The payment the watch last gave up on; a fresh focus clears it.
  const [stoppedFor, setStoppedFor] = useState<string | null>(null);
  const gaveUp = watchedId !== null && stoppedFor === watchedId;

  // Lives in the panel, so a closed panel never polls.
  useEffect(() => {
    if (!watchedId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let deadline = 0;

    const tick = () => {
      if (Date.now() >= deadline) {
        setStoppedFor(watchedId);
        return;
      }
      // A hidden tab is a customer paying in the other one.
      if (document.visibilityState === "visible") checkPayment();
      timer = setTimeout(tick, POLL_EVERY_MS);
    };

    const watch = () => {
      clearTimeout(timer);
      deadline = Date.now() + POLL_FOR_MS;
      if (document.visibilityState === "visible") checkPayment();
      timer = setTimeout(tick, POLL_EVERY_MS);
    };

    const onFocus = () => {
      setStoppedFor(null);
      watch();
    };

    // From the moment the payment starts, or the panel opens on one — and
    // again whenever the customer comes back to this window.
    watch();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearTimeout(timer);
    };
  }, [watchedId, checkPayment]);

  /* ------------------------------------------- dialog focus and keyboard */

  useEffect(() => {
    if (!isOverlay) return;

    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      opener?.focus?.();
    };
  }, [close, isOverlay]);

  // The bottom sheet covers the page; letting the page scroll behind it is how
  // a customer loses their place.
  useEffect(() => {
    if (!isOverlay || !isMobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, isOverlay]);

  /* ---------------------------------------------------------- composing */

  const onAction: SendAction = (action, label) => send(action, label);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query || pending) return;
    setDraft("");
    // Until free text arrives in Phase 6, typed words are a salon search - the
    // one thing the guided flow can already answer from any step.
    send({ type: "search_salons", query }, query);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) close();
  };

  /* ------------------------------------------------------------- render */

  const body = (
    <>
      <header
        className={cn(
          "flex shrink-0 items-center gap-3 border-b border-border px-4",
          isOverlay && isMobile ? "pb-3 pt-1" : "py-3",
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-gold text-white shadow-gold">
          <Sparkles className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="truncate text-sm font-bold text-foreground">
            Book with AI
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            Tap your way to an appointment
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          disabled={pending}
          title="Start a new chat"
          aria-label="Start a new chat"
          className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>

        {isOverlay && (
          <button
            type="button"
            onClick={close}
            aria-label="Close the assistant"
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <X className="h-4.5 w-4.5" aria-hidden />
          </button>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onWheel={handleUserScroll}
          onTouchMove={handleUserScroll}
          onKeyDown={handleUserScroll}
          aria-live="polite"
          aria-busy={pending}
          className="h-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4"
        >
          <AssistantMessages
            messages={messages}
            pending={pending}
            pendingLabel={pendingLabel}
            onAction={onAction}
            onConfirm={confirm}
            confirming={confirming}
            confirmedToken={confirmedToken}
            onTopup={topup}
            toppingUp={toppingUp}
          />

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5">
              <p className="text-sm text-foreground">{error.message}</p>
              <button
                type="button"
                onClick={error.retry}
                className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Try again
              </button>
            </div>
          )}
        </div>

        {unseen && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg"
          >
            New message
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {pendingTopup && (
        <div
          role="status"
          className="flex shrink-0 items-center gap-3 border-t border-gold/30 bg-gold/5 px-4 py-2.5"
        >
          {checkingPayment || (!gaveUp && !pending) ? (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin text-gold"
              aria-hidden
            />
          ) : (
            <Wallet className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          )}
          <p className="min-w-0 flex-1 text-xs leading-snug text-foreground">
            <span className="font-semibold">
              Waiting for your {formatBDT(pendingTopup.amountMinor)} payment
            </span>
            <span className="block text-muted-foreground">
              {gaveUp
                ? "Paid already? Tap Check again."
                : pendingTopup.autoConfirm
                  ? "Your booking finishes by itself when it lands."
                  : "Come back here once you have paid."}
            </span>
          </p>
          <Chip
            label="Check again"
            icon="refresh"
            style={gaveUp ? "primary" : "ghost"}
            disabled={pending || checkingPayment}
            onClick={() => send({ type: "check_payment" }, "Check again")}
            className="shrink-0"
          />
        </div>
      )}

      <footer className="shrink-0 border-t border-border px-4 pb-4 pt-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
            maxLength={300}
            aria-label="Search salons"
            placeholder="Search salons, or tap an option above"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label="Search"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Nothing is booked until you tap Confirm.
        </p>
      </footer>
    </>
  );

  if (!isOverlay) {
    return (
      <div className="flex h-[min(760px,78svh)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        {body}
      </div>
    );
  }

  const enter = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: isMobile ? 24 : 12, scale: isMobile ? 1 : 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: isMobile ? 24 : 12, scale: isMobile ? 1 : 0.98 },
      };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={close}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] md:bg-black/20 md:backdrop-blur-none"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        {...enter}
        transition={{ duration: 0.2 }}
        drag={isMobile ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={handleDragEnd}
        className={cn(
          "absolute flex flex-col overflow-hidden border border-border bg-background shadow-2xl outline-none",
          // `svh`, not `vh`: iOS Safari's toolbar makes `vh` taller than the
          // screen, which buries the composer.
          "inset-x-0 bottom-0 h-[88svh] rounded-t-2xl",
          "md:inset-x-auto md:bottom-5 md:right-5 md:h-[min(680px,80vh)] md:w-[420px] md:rounded-2xl",
        )}
      >
        {isMobile && (
          <div
            onPointerDown={(event) => dragControls.start(event)}
            className="flex shrink-0 cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing"
          >
            <span className="h-1 w-10 rounded-full bg-border" aria-hidden />
          </div>
        )}
        {body}
      </motion.div>
    </div>,
    document.body,
  );
};

export default AssistantPanel;
