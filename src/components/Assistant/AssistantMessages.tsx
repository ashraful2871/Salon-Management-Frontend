"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AssistantMessage } from "@/lib/assistant-types";
import AssistantBlocks from "./AssistantBlocks";
import type { SendAction } from "./block-props";
import type { StartTopup } from "./blocks/PaymentPrompt";

type AssistantMessagesProps = {
  messages: AssistantMessage[];
  pending: boolean;
  pendingLabel: string;
  onAction: SendAction;
  onConfirm: (confirmToken: string) => void;
  confirming: boolean;
  confirmedToken: string | null;
  onTopup: StartTopup;
  toppingUp: boolean;
};

const TypingIndicator = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2.5">
    <span
      className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3.5 py-3"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const AssistantMessages = ({
  messages,
  pending,
  pendingLabel,
  onAction,
  onConfirm,
  confirming,
  confirmedToken,
  onTopup,
  toppingUp,
}: AssistantMessagesProps) => {
  const reduceMotion = useReducedMotion();

  const enter = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-4">
      {messages.map((message, i) => {
        if (message.role === "TOOL") return null;

        if (message.role === "USER") {
          if (!message.text) return null;
          return (
            <motion.div
              key={message.id}
              {...enter}
              transition={{ duration: 0.18 }}
              className="flex justify-end"
            >
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground",
                  message.optimistic && "opacity-70",
                )}
              >
                {message.text}
              </p>
            </motion.div>
          );
        }

        // What this question was answered with, so the chip the customer chose
        // still reads as chosen when they scroll back up.
        const chosen = messages
          .slice(i + 1)
          .find((m) => m.role === "USER")?.text;

        return (
          <motion.div
            key={message.id}
            {...enter}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {message.text && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-gold text-white">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                </span>
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground">
                  {message.text}
                </p>
              </div>
            )}

            {/* Blocks sit below the bubble, full width: a card inside a bubble
                is unreadable on a 360 px screen. */}
            <AssistantBlocks
              blocks={message.blocks}
              disabled={pending}
              chosen={chosen ?? undefined}
              onAction={onAction}
              onConfirm={onConfirm}
              confirming={confirming}
              confirmedToken={confirmedToken}
              onTopup={onTopup}
              toppingUp={toppingUp}
            />
          </motion.div>
        );
      })}

      {pending && <TypingIndicator label={pendingLabel} />}
    </div>
  );
};

export default AssistantMessages;
