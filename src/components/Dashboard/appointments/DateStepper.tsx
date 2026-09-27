"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDays, dhakaToday, formatDay } from "./format";

// The calendar works in local Date objects; the URL in YYYY-MM-DD days.
const toDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toYmd = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const PILL =
  "h-9 border-border bg-surface px-3.5 text-[13px] font-medium aria-pressed:border-primary/40 aria-pressed:bg-primary-soft aria-pressed:text-primary-hover md:h-8";

/**
 * ‹ Sat 26 Sep › with a calendar behind the date, plus Today and All dates.
 * `date` is null for every date.
 */
export const DateStepper = ({
  date,
  onChange,
  className,
}: {
  date: string | null;
  onChange: (date: string | null) => void;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const today = dhakaToday();
  // With every date shown, the arrows and the calendar start from today.
  const current = date ?? today;

  const pick = (next: string | null) => {
    setOpen(false);
    onChange(next);
  };

  return (
    // A phone gets the stepper on its own row and the two pills under it, half
    // each; from sm everything sits on one line.
    <div className={cn("grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center", className)}>
      <div
        role="group"
        aria-label="Day"
        className="col-span-2 flex items-center justify-between rounded-full border border-border bg-surface sm:justify-start"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous day"
          onClick={() => pick(addDays(current, -1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "min-w-32 px-3 tabular-nums",
                !date && "text-muted-foreground",
              )}
              aria-label={date ? `${formatDay(date)}, pick a date` : "Pick a date"}
            >
              <CalendarDays aria-hidden="true" className="text-muted-foreground" />
              {date ? formatDay(date) : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            collisionPadding={16}
            className="w-auto rounded-2xl border-border bg-surface p-0"
          >
            <Calendar
              mode="single"
              selected={date ? toDate(date) : undefined}
              defaultMonth={toDate(current)}
              onSelect={(day) => day && pick(toYmd(day))}
              autoFocus
              className="rounded-2xl bg-surface [--cell-size:--spacing(9)] pointer-coarse:[--cell-size:--spacing(10)]"
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next day"
          onClick={() => pick(addDays(current, 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        aria-pressed={date === today}
        className={PILL}
        onClick={() => pick(today)}
      >
        Today
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={date === null}
        className={PILL}
        onClick={() => pick(null)}
      >
        All dates
      </Button>
    </div>
  );
};
