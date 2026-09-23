"use client";

import { AlertTriangle, Info, OctagonAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Block } from "@/lib/assistant-types";

type NoticeBlock = Extract<Block, { type: "notice" }>;

const TONES = {
  info: {
    icon: Info,
    className: "border-border bg-muted/50 text-foreground",
    iconClass: "text-muted-foreground",
  },
  warn: {
    icon: AlertTriangle,
    className: "border-gold/40 bg-gold/10 text-foreground",
    iconClass: "text-gold",
  },
  error: {
    icon: OctagonAlert,
    className: "border-destructive/40 bg-destructive/10 text-foreground",
    iconClass: "text-destructive",
  },
} as const;

const Notice = ({ block }: { block: NoticeBlock }) => {
  const tone = TONES[block.tone] ?? TONES.info;
  const Icon = tone.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        tone.className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.iconClass)} aria-hidden />
      <p className="min-w-0 leading-relaxed">{block.text}</p>
    </div>
  );
};

export default Notice;
