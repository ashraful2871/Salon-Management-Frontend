"use client";

import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import type { BlockProps } from "../block-props";

type CounterPickerBlock = Extract<Block, { type: "counter_picker" }>;

/** The API only sends this when there is a real choice: a salon with one chair
 *  never reaches a counter step, it is named in the sentence above the times. */
const CounterPicker = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<CounterPickerBlock>) => {
  const counters = block.counters ?? [];
  if (counters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {counters.map((counter) => (
        <Chip
          key={counter.id}
          selected={chosen === counter.name}
          disabled={disabled}
          onClick={() =>
            onAction(
              { type: "choose_counter", counterId: counter.id },
              counter.name,
            )
          }
          className="flex-col items-start gap-0 rounded-xl px-3.5 py-2"
        >
          <span className="text-sm font-semibold">
            {counter.name}
            {counter.code && (
              <span className="ml-1 font-normal text-muted-foreground">
                {counter.code}
              </span>
            )}
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {counter.slotCount} time{counter.slotCount === 1 ? "" : "s"} free
          </span>
        </Chip>
      ))}
    </div>
  );
};

export default CounterPicker;
