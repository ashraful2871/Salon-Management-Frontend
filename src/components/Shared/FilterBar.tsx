"use client";

import { useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PendingBar } from "@/components/Shared/PendingRegion";
import { cn } from "@/lib/utils";

export type FilterChip = { value: string; label: string; count?: number };

export type FilterBarProps = {
  /** Typed locally, applied on Enter. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    placeholder?: string;
    label?: string;
  };
  /** One-of filter shown as pills; the active one is the pressed pill. */
  chips?: {
    value: string;
    options: FilterChip[];
    onChange: (value: string) => void;
    label?: string;
  };
  /** Further controls: inline from `md` up, in a bottom sheet on phones. */
  extra?: ReactNode;
  /**
   * A control that stays visible everywhere (e.g. a date stepper): right of
   * the search from `md` up, under the pills on phones.
   */
  aside?: ReactNode;
  /** Filters in effect; shows a badge on the phone's Filters pill and "Clear". */
  activeCount?: number;
  onClear?: () => void;
  pending?: boolean;
};

/**
 * Search, status pills and any other filters for a list page. From `md` up:
 * search and `aside` on the first row, the pills (wrapping) under them. On a
 * phone the pills scroll sideways on their own row and `extra` moves into a
 * sheet, so the bar never pushes the page wider than the screen.
 */
export function FilterBar({
  search,
  chips,
  extra,
  aside,
  activeCount = 0,
  onClear,
  pending = false,
}: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const clear =
    onClear && activeCount > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onClear}
      >
        <X aria-hidden="true" />
        Clear
      </Button>
    ) : null;

  return (
    <div className="relative">
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-x-4">
        <div className={cn("flex min-w-0 items-center gap-2", !aside && "md:col-span-2")}>
          {search && (
            <form
              role="search"
              className="relative min-w-0 flex-1 md:max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                search.onSubmit(search.value.trim());
              }}
            >
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                enterKeyHint="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? "Search"}
                aria-label={search.label ?? search.placeholder ?? "Search"}
                className="rounded-full bg-surface pl-10"
              />
            </form>
          )}
          {extra && (
            <>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 md:hidden"
                onClick={() => setSheetOpen(true)}
              >
                <SlidersHorizontal aria-hidden="true" />
                Filters
                {activeCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                    {activeCount}
                  </span>
                )}
              </Button>
              <div className="hidden items-center gap-2 md:flex md:flex-wrap">{extra}</div>
            </>
          )}
          {/* With pills, Clear sits after them from md; without, it stays here. */}
          <div className={cn("shrink-0", chips && "md:hidden")}>{clear}</div>
        </div>

        {aside && <div className="order-last md:order-none">{aside}</div>}

        {chips && (
          <div className="flex min-w-0 items-center gap-2 md:col-span-2">
            <div className="relative min-w-0 flex-1">
              <ToggleGroup
                type="single"
                spacing={2}
                value={chips.value}
                // Pressing the active pill would clear it; a filter always has a value.
                onValueChange={(value) => value && chips.onChange(value)}
                aria-label={chips.label ?? "Filter"}
                className="flex w-full snap-x scroll-px-1 gap-2 overflow-x-auto pr-8 [scrollbar-width:none] md:snap-none md:flex-wrap md:overflow-visible md:pr-0 [&::-webkit-scrollbar]:hidden"
              >
                {chips.options.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className="h-9 shrink-0 snap-start rounded-full border border-border bg-surface px-3.5 text-[13px] font-medium text-foreground hover:bg-muted hover:text-foreground data-[state=on]:border-primary/40 data-[state=on]:bg-primary-soft data-[state=on]:text-primary-hover md:h-8"
                  >
                    {option.label}
                    {option.count !== undefined && (
                      <span className="text-muted-foreground tabular-nums">
                        {option.count.toLocaleString("en-US")}
                      </span>
                    )}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {/* Hints that the row scrolls; from md the pills wrap instead. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-background to-transparent md:hidden"
              />
            </div>
            <div className="hidden md:block">{clear}</div>
          </div>
        )}
      </div>

      {extra && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] gap-0 rounded-t-2xl border-border bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
          >
            <SheetHeader className="px-4 pt-5 pb-3">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="sr-only">
                Narrow down the list
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pb-2">
              {extra}
            </div>
            <div className="flex gap-2 px-4 pt-3">
              {onClear && activeCount > 0 && (
                <Button variant="outline" className="flex-1" onClick={onClear}>
                  Clear
                </Button>
              )}
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                Done
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* In the gap under the bar, so showing it moves nothing. */}
      {pending && (
        <PendingBar pending className="absolute inset-x-4 top-full mt-1.5" />
      )}
    </div>
  );
}
