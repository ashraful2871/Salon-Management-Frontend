"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { Block } from "@/lib/assistant-types";
import { formatTime } from "../format";
import type { BlockProps } from "../block-props";

type SlotPickerBlock = Extract<Block, { type: "slot_picker" }>;

/**
 * Morning / Afternoon / Evening, because thirty times in one list is a wall.
 * `counterName` at the top means every time below belongs to that one chair;
 * when it is null the times come from several, so each says which.
 */
const SlotPicker = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<SlotPickerBlock>) => {
  const groups = (block.groups ?? []).filter((g) => g.slots?.length > 0);
  const focusRef = useRef<HTMLDivElement>(null);

  // A typed "evening" / "bikele": bring that band into view once, when the
  // picker first appears. Every band stays on screen.
  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  if (groups.length === 0) return null;

  const showCounter = block.counterName == null;

  return (
    <div className="space-y-3">
      {block.counterName && (
        <p className="text-xs text-muted-foreground">
          Times at{" "}
          <span className="font-medium text-foreground">
            {block.counterName}
          </span>
        </p>
      )}

      {groups.map((group) => (
        <div
          key={group.label}
          ref={group.label === block.focus ? focusRef : undefined}
        >
          <h5
            className={cn(
              "mb-1.5 text-[11px] font-semibold uppercase tracking-wider",
              group.label === block.focus ? "text-gold" : "text-muted-foreground",
            )}
          >
            {group.label}
            {group.label === block.focus && (
              <span className="ml-1.5 normal-case tracking-normal">· as you asked</span>
            )}
          </h5>
          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4">
            {group.slots.map((slot) => {
              const label = formatTime(slot.startTime);
              const selected = chosen === label;
              // "after 5": earlier times stay tappable, just quieter.
              const early = Boolean(block.after) && slot.startTime.slice(0, 5) < (block.after ?? "");

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    onAction({ type: "choose_slot", slotId: slot.id }, label)
                  }
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={
                    showCounter && slot.counterName
                      ? `${label} at ${slot.counterName}`
                      : label
                  }
                  className={cn(
                    "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border px-1 py-1.5",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    selected
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-background hover:border-primary/50 hover:bg-primary/5",
                    early && !selected && "opacity-60",
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {label}
                  </span>
                  {showCounter && slot.counterName && (
                    <span className="w-full truncate text-center text-[10px] leading-tight text-muted-foreground">
                      {slot.counterName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SlotPicker;
