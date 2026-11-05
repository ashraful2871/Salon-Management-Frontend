"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/Shared/EmptyState";
import { formatTime12 } from "@/components/Dashboard/appointments/format";
import { cn } from "@/lib/utils";
import { durationLabel, servicesOf, type FreeOption } from "./availability";
import { minutesOf } from "./calendar-grid";

const ALL = "__all";

const PARTS = [
  { label: "Morning", until: 12 * 60 },
  { label: "Afternoon", until: 17 * 60 },
  { label: "Evening", until: 24 * 60 },
] as const;

/**
 * Every free time of the day by service, split into morning / afternoon /
 * evening: the desk's answer to "can you fit me in for a haircut?". A tap
 * opens the booking dialog on that time.
 */
export function AvailabilityPanel({
  options,
  isPastDay,
  dayLabel,
  onPick,
  className,
}: {
  options: FreeOption[];
  isPastDay: boolean;
  dayLabel: string;
  onPick: (option: FreeOption) => void;
  className?: string;
}) {
  const services = useMemo(() => servicesOf(options), [options]);
  const [filter, setFilter] = useState(ALL);
  const active = filter === ALL || services.some((s) => s.key === filter) ? filter : ALL;
  const shown = active === ALL ? services : services.filter((s) => s.key === active);

  return (
    <section
      aria-labelledby="available-times"
      className={cn("flex min-h-0 flex-col rounded-2xl border border-border bg-surface", className)}
    >
      <header className="space-y-3 border-b border-border p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="available-times" className="font-semibold text-foreground">
            Available times
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {options.length} free · {dayLabel}
          </span>
        </div>
        {services.length > 1 && (
          <Select value={active} onValueChange={setFilter}>
            <SelectTrigger aria-label="Filter by service" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All services</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {options.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={isPastDay ? "This day has passed" : "No free times"}
            description={
              isPastDay
                ? "Pick today or a later day to book a customer."
                : "Every open slot is booked or has started. Open more times on the Slots page."
            }
            action={
              isPastDay ? undefined : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/slots">Go to Slots</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-6">
            {shown.map((service) => {
              const times = options.filter((o) => o.serviceKey === service.key);
              return (
                <div key={service.key} className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{service.name}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {[durationLabel(service.durationMin), `${times.length} free`].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {PARTS.map((part, i) => {
                    const from = i === 0 ? 0 : PARTS[i - 1].until;
                    const inPart = times.filter((o) => {
                      const m = minutesOf(o.start) ?? 0;
                      return m >= from && m < part.until;
                    });
                    if (inPart.length === 0) return null;
                    return (
                      <div key={part.label} className="space-y-1.5">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {part.label}
                        </p>
                        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-3">
                          {inPart.map((o) => (
                            <li key={o.key}>
                              <button
                                type="button"
                                onClick={() => onPick(o)}
                                aria-label={`Book ${service.name} at ${formatTime12(o.time)}`}
                                className="h-9 w-full rounded-full border border-success/35 bg-success-soft/50 text-[13px] font-medium text-foreground tabular-nums transition-colors hover:border-success hover:bg-success-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                              >
                                {formatTime12(o.time)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
