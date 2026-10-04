"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAssistantLauncher } from "./AssistantContext";
import { preloadAssistantPanel } from "./preloadPanel";

/** Shown once, ever, to say the button is new. A ring that pulses on every
 *  visit is a nag, not an invitation. */
const SEEN_KEY = "sm_chat_seen";

// Nothing else writes this key, so there is nothing to subscribe to; the flag
// is read once per render and "seen" is the server's answer, so a returning
// visitor never gets a flash of pulse before hydration corrects it.
const noSubscribe = () => () => {};
const readSeen = () => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const AssistantLauncher = () => {
  const pathname = usePathname();
  const { isOpen, openWith } = useAssistantLauncher();
  const seen = useSyncExternalStore(noSubscribe, readSeen, () => true);
  const [dismissed, setDismissed] = useState(false);

  const pulse = !seen && !dismissed;

  // The dashboard has its own chrome, and the chat is the whole of /assistant.
  const hidden =
    isOpen ||
    pathname === "/assistant" ||
    pathname?.startsWith("/dashboard") ||
    false;

  if (hidden) return null;

  const handleClick = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    openWith();
  };

  return (
    <div className="fixed right-4 bottom-[calc(1rem+var(--launcher-offset)+env(safe-area-inset-bottom))] z-50 transition-[bottom] duration-200 motion-reduce:transition-none md:right-8 md:bottom-[calc(2rem+var(--launcher-offset))]">
      {pulse && (
        <span
          className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping"
          style={{ animationIterationCount: 3 }}
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        // Start fetching the panel chunk before the click lands.
        onPointerEnter={preloadAssistantPanel}
        onFocus={preloadAssistantPanel}
        onTouchStart={preloadAssistantPanel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="AI Assistant"
        className={cn(
          // A circle on phones (it shares the bottom edge with page pills), a
          // labelled pill from `sm`.
          "relative flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground shadow-card sm:w-auto sm:px-5",
          "transition-[background-color,transform] duration-200 hover:bg-primary-hover motion-safe:active:scale-95",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
        <span className="hidden text-sm font-semibold sm:inline">
          AI Assistant
        </span>
      </button>
    </div>
  );
};

export default AssistantLauncher;
