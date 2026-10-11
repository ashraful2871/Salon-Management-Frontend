"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import { ANALYTICS_PRESETS, CHANNELS, dhakaDay, type AnalyticsFilters } from "./filters";
import { formatRange } from "./format";

const ALL = "__all";

const chip = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-surface text-foreground hover:bg-muted",
  );

const asDate = (day: string) => new Date(`${day}T00:00:00`);
const asDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * The one filter row above every chart. All of it is in the URL
 * (`?range=30d&compare=prev&area=&channel=&test=0`), so a view can be shared,
 * and changing it re-renders the page in a transition: the previous figures
 * stay on screen, dimmed, until the new ones arrive.
 */
export function DateRangeFilter({
  filters,
  areas = [],
  presetsOnly = false,
}: {
  filters: AnalyticsFilters;
  areas?: string[];
  /** Home: presets only, no compare/area/channel/test controls. */
  presetsOnly?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(() =>
    filters.range === "custom" ? { from: asDate(filters.from), to: asDate(filters.to) } : undefined,
  );

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const applyCustom = () => {
    if (!draft?.from) return;
    setOpen(false);
    go({ range: "custom", from: asDay(draft.from), to: asDay(draft.to ?? draft.from) });
  };

  const today = asDate(dhakaDay(new Date()));

  return (
    <div
      role="group"
      aria-label="Analytics filters"
      aria-busy={isPending}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", isPending && "opacity-70")}
    >
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
        {ANALYTICS_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={filters.range === preset.value}
            onClick={() => go({ range: preset.value, from: null, to: null })}
            className={chip(filters.range === preset.value)}
          >
            {preset.label}
          </button>
        ))}
        {!presetsOnly && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-pressed={filters.range === "custom"}
                className={chip(filters.range === "custom")}
              >
                <CalendarRange className="size-4" aria-hidden />
                {filters.range === "custom" ? formatRange(filters.from, filters.to) : "Custom"}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-2">
              <Calendar
                mode="range"
                selected={draft}
                onSelect={setDraft}
                defaultMonth={draft?.from ?? today}
                disabled={{ after: today }}
                numberOfMonths={1}
              />
              <div className="flex justify-end gap-2 px-2 pb-1">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!draft?.from} onClick={applyCustom}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {!presetsOnly && (
        <>
          <div className="flex items-center gap-2">
            <Switch
              id="analytics-compare"
              checked={filters.compare === "prev"}
              onCheckedChange={(on) => go({ compare: on ? null : "none" })}
            />
            <Label htmlFor="analytics-compare" className="text-sm font-normal">
              Compare to previous period
            </Label>
          </div>

          <Select
            value={filters.area ?? ALL}
            onValueChange={(v) => go({ area: v === ALL ? null : v })}
          >
            <SelectTrigger size="sm" aria-label="Area" className="w-40">
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All areas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.channel ?? ALL}
            onValueChange={(v) => go({ channel: v === ALL ? null : v })}
          >
            <SelectTrigger size="sm" aria-label="Channel" className="w-36">
              <SelectValue placeholder="All channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All channels</SelectItem>
              {CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              id="analytics-test"
              checked={filters.includeTest ?? false}
              onCheckedChange={(on) => go({ test: on ? "1" : null })}
            />
            <Label htmlFor="analytics-test" className="text-sm font-normal">
              Include test data
            </Label>
          </div>
        </>
      )}
    </div>
  );
}
