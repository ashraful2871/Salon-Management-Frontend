"use client";

import { track } from "@/lib/track";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MessageCircleMore, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAssistantLauncher } from "./AssistantContext";
import { preloadAssistantPanel } from "./preloadPanel";

/** Set once the visitor has opened the chat or closed the greeting. The
 *  greeting shows once, ever: one that comes back on every visit is a nag. */
const SEEN_KEY = "sm_chat_seen";
/** Let the page settle before the greeting slides in. */
const GREETING_DELAY_MS = 4000;

// Nothing else writes this key, so there is nothing to subscribe to; the flag
// is read once per render and "seen" is the server's answer, so a returning
// visitor never gets a flash of the greeting before hydration corrects it.
const noSubscribe = () => () => {};
const readSeen = () => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
};
const markSeen = () => {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
};

const AssistantLauncher = () => {
  const pathname = usePathname();
  const { isOpen, openWith } = useAssistantLauncher();
  const seen = useSyncExternalStore(noSubscribe, readSeen, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [greetingDue, setGreetingDue] = useState(false);

  // The dashboard has its own chrome, and the chat is the whole of /assistant.
  const hidden =
    isOpen ||
    pathname === "/assistant" ||
    pathname?.startsWith("/dashboard") ||
    false;

  const wantsGreeting = !seen && !dismissed && !hidden;
  useEffect(() => {
    if (!wantsGreeting) return;
    const timer = window.setTimeout(() => setGreetingDue(true), GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [wantsGreeting]);

  if (hidden) return null;

  const showGreeting = wantsGreeting && greetingDue;

  const open = () => {
    track("assistant_opened", "entry:launcher");
    setDismissed(true);
    markSeen();
    openWith();
  };

  const dismissGreeting = () => {
    setDismissed(true);
    markSeen();
  };

  return (
    <div data-chat-launcher className="fixed right-4 bottom-[calc(1rem+var(--launcher-offset)+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 transition-[bottom] duration-200 motion-reduce:transition-none md:right-6 md:bottom-[calc(1.5rem+var(--launcher-offset))]">
      {showGreeting && (
        <div
          data-chat-greeting
          role="status"
          className="relative w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-4 pr-10 shadow-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
        >
          <button
            type="button"
            onClick={open}
            onPointerEnter={preloadAssistantPanel}
            className="block w-full cursor-pointer text-left focus-visible:outline-none"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-success opacity-60 motion-safe:animate-ping" style={{ animationIterationCount: 2 }} />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Salon Assistant
            </span>
            <span className="mt-1 block text-sm leading-snug text-muted-foreground">
              Need a salon? I can find one near you and book it in a minute.
            </span>
            <span className="mt-2 inline-block text-sm font-semibold text-primary-hover">
              Start a chat
            </span>
          </button>
          <button
            type="button"
            onClick={dismissGreeting}
            aria-label="Dismiss"
            className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
          {/* The tail, pointing at the button below. */}
          <span
            aria-hidden
            className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-r border-b border-border bg-surface"
          />
        </div>
      )}

      <button
        type="button"
        onClick={open}
        // Start fetching the panel chunk before the click lands.
        onPointerEnter={preloadAssistantPanel}
        onFocus={preloadAssistantPanel}
        onTouchStart={preloadAssistantPanel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          // Phones: a round icon button that keeps out of the page's way.
          // From `sm`, a labelled pill: the icon says "chat", the words say
          // what for.
          "group relative inline-flex size-13 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35)] sm:h-14 sm:w-auto sm:justify-start sm:gap-2.5 sm:pl-4 sm:pr-5 md:h-15 md:pl-5 md:pr-6",
          "transition-[background-color,transform,box-shadow] duration-200 hover:bg-primary-hover motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <span className="relative shrink-0">
          <MessageCircleMore className="size-6" strokeWidth={2} aria-hidden />
          {/* Online: the assistant answers at any hour. */}
          <span
            aria-hidden
            className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-primary bg-success group-hover:border-primary-hover"
          />
        </span>
        {/* Still the button's name on phones, where only the icon shows. */}
        <span className="sr-only text-[15px] font-semibold whitespace-nowrap sm:not-sr-only">
          Book with AI
        </span>
      </button>
    </div>
  );
};

export default AssistantLauncher;
