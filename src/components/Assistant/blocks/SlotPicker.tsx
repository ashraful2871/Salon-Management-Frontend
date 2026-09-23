"use client";

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
        <div key={group.label}>
          <h5 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h5>
          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4">
            {group.slots.map((slot) => {
              const label = formatTime(slot.startTime);
              const selected = chosen === label;

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
