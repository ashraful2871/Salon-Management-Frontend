"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAssistantLauncher } from "./AssistantContext";

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
    <div className="fixed bottom-20 right-5 z-40 md:bottom-5">
      {pulse && (
        <span
          className="absolute inset-0 animate-ping rounded-full bg-gold/40"
          style={{ animationIterationCount: 3 }}
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Book with AI"
        className={cn(
          "relative flex h-14 cursor-pointer items-center gap-2 rounded-full bg-gradient-gold text-white shadow-gold",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
          "w-14 justify-center sm:w-auto sm:justify-start sm:px-5",
        )}
      >
        <Sparkles className="h-6 w-6 shrink-0 sm:h-5 sm:w-5" aria-hidden />
        <span className="hidden text-sm font-semibold sm:inline">
          Book with AI
        </span>
      </button>
    </div>
  );
};

export default AssistantLauncher;
