"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { formatRange } from "@/components/Admin/analytics/format";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import { dhakaToday, REPORT_PRESETS, REPORT_TABS, type ReportFilters } from "./report-filters";

const chip = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-surface text-foreground hover:bg-muted",
  );

const useGo = () => {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const hrefWith = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  return { hrefWith, go: (patch: Record<string, string | null>) => navigate(hrefWith(patch)), navigate, isPending };
};

/** Presets, custom range and Compare: all in the URL, applied in one transition. */
export function ReportFilterRow({ filters }: { filters: ReportFilters }) {
  const { go, isPending } = useGo();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  const today = dhakaToday();

  return (
    <div
      role="group"
      aria-label="Report filters"
      aria-busy={isPending}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", isPending && "opacity-70")}
    >
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
        {REPORT_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={filters.range === p.value}
            onClick={() => go({ range: p.value, from: null, to: null })}
            className={chip(filters.range === p.value)}
          >
            {p.label}
          </button>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-pressed={filters.range === "custom"} className={chip(filters.range === "custom")}>
              <CalendarRange className="size-4" aria-hidden />
              {filters.range === "custom" ? formatRange(filters.from, filters.to) : "Custom"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="report-from" className="text-xs">From</Label>
                <Input id="report-from" type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-to" className="text-xs">To</Label>
                <Input id="report-to" type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!from || !to || to < from}
                onClick={() => {
                  setOpen(false);
                  go({ range: "custom", from, to });
                }}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="report-compare"
          checked={filters.compare}
          onCheckedChange={(on) => go({ compare: on ? "1" : null })}
        />
        <Label htmlFor="report-compare" className="text-sm font-normal">
          Compare to previous period
        </Label>
      </div>
    </div>
  );
}

/** `?tab=` keeps the filters; scrolls sideways on a phone. */
export function ReportTabs({ current, showMoney }: { current: string; showMoney: boolean }) {
  const { hrefWith, navigate } = useGo();
  const tabs = REPORT_TABS.filter((t) => !t.ownerOnly || showMoney);
  return (
    <nav aria-label="Report sections" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {tabs.map((t) => {
          const href = hrefWith({ tab: t.key === "overview" ? null : t.key });
          const active = t.key === current;
          return (
            <li key={t.key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navigate(href);
                }}
                className={cn(
                  "block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
