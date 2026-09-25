"use client";

import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import type { BlockProps } from "../block-props";

type DatePickerBlock = Extract<Block, { type: "date_picker" }>;

/** Only days that still have something free reach this list, so a day being
 *  here is already a promise. The label is written by the server ("Fri 25 Sep",
 *  "Today"), and it is also what the customer's own bubble will say. */
const DatePicker = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<DatePickerBlock>) => {
  const dates = block.dates ?? [];
  if (dates.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {dates.map((option) => (
        <Chip
          key={option.date}
          selected={chosen === option.label}
          disabled={disabled}
          onClick={() =>
            onAction({ type: "choose_date", date: option.date }, option.label)
          }
          className="flex-col items-start gap-0 rounded-xl px-3.5 py-2"
        >
          <span className="text-sm font-semibold">{option.label}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {option.slotCount} free
          </span>
        </Chip>
      ))}
    </div>
  );
};

export default DatePicker;
