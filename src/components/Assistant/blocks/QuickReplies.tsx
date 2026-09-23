"use client";

import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import type { BlockProps } from "../block-props";

type QuickRepliesBlock = Extract<Block, { type: "quick_replies" }>;

const QuickReplies = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<QuickRepliesBlock>) => {
  const options = block.options ?? [];
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, i) => (
        <Chip
          key={`${option.label}-${i}`}
          label={option.label}
          icon={option.icon}
          style={option.style}
          selected={chosen === option.label}
          disabled={disabled}
          onClick={() => onAction(option.action, option.label)}
        />
      ))}
    </div>
  );
};

export default QuickReplies;
