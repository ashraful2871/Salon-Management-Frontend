"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { sendAssistantFeedback } from "@/services/assistant/sendAssistantFeedback";

/** Messages the client drew itself (optimistic bubbles, the confirm card) have
 *  no server row to rate, and their ids are not UUIDs. */
const SERVER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const canRate = (id: string) => SERVER_ID.test(id);

/**
 * 👍 / 👎 under an assistant turn that carried blocks. Optimistic: the thumb
 * lights at once and goes back if the server says no. A second tap on the
 * other thumb changes the rating; it is an opinion, not a vote.
 */
const MessageFeedback = ({
  messageId,
  initial,
}: {
  messageId: string;
  initial?: number | null;
}) => {
  const [value, setValue] = useState<number | null>(initial ?? null);
  const [sending, setSending] = useState(false);

  const rate = async (next: 1 | -1) => {
    if (sending || value === next) return;
    const before = value;
    setValue(next);
    setSending(true);
    const result = await sendAssistantFeedback(messageId, next);
    if (!result.success) setValue(before);
    setSending(false);
  };

  const button = (target: 1 | -1) => {
    const Icon = target === 1 ? ThumbsUp : ThumbsDown;
    const active = value === target;
    return (
      <button
        type="button"
        onClick={() => void rate(target)}
        disabled={sending}
        aria-pressed={active}
        aria-label={target === 1 ? "Helpful" : "Not helpful"}
        title={target === 1 ? "Helpful" : "Not helpful"}
        className={cn(
          "grid h-8 w-8 cursor-pointer place-items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-0.5 pl-8" aria-label="Rate this answer">
      {button(1)}
      {button(-1)}
      {value !== null && (
        <span className="ml-1 text-[11px] text-muted-foreground" aria-live="polite">
          Thanks for the feedback
        </span>
      )}
    </div>
  );
};

export default MessageFeedback;
