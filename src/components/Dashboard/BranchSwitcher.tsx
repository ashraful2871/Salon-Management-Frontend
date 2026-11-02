"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Store } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setSelectedBranch } from "@/lib/branch-cookie";
import { cn } from "@/lib/utils";

export type BranchOption = { salonId: string; salonName: string };

/** A list this long gets searched, not scrolled; hundreds of rows slow the typing down. */
const MAX_ROWS = 50;

/** Every typed word must appear: "rupkotha lake" finds "Rupkotha Beauty Parlour (Lake Circus)". */
function matchesName(name: string, search: string) {
  const lowerName = name.toLowerCase();
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => lowerName.includes(word));
}

/** Mounted only while the popover is open, so each opening starts a fresh search. */
function BranchList({
  options,
  selected,
  onSelect,
}: {
  options: BranchOption[];
  selected: string;
  onSelect: (salonId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const matches = options.filter((option) => matchesName(option.salonName, search));
  // Before any search the current branch comes first, so MAX_ROWS never hides it.
  const ordered = search
    ? matches
    : [...matches].sort(
        (a, b) => Number(b.salonId === selected) - Number(a.salonId === selected),
      );
  const rows = ordered.slice(0, MAX_ROWS);

  return (
    <Command
      shouldFilter={false}
      defaultValue={selected}
      className="**:data-[slot=command-input-wrapper]:h-11"
    >
      {/* 16px on phones: iOS zooms the page when a smaller input takes focus. */}
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search branches..."
        aria-label="Search branches"
        className="h-11 text-base md:text-sm"
      />
      <CommandList className="max-h-[min(20rem,calc(var(--radix-popover-content-available-height,100vh)-5rem))]">
        <CommandEmpty>No branch found.</CommandEmpty>
        <CommandGroup>
          {rows.map((option) => (
            <CommandItem
              key={option.salonId}
              value={option.salonId}
              onSelect={() => onSelect(option.salonId)}
              aria-current={option.salonId === selected ? "true" : undefined}
              className="cursor-pointer py-2"
            >
              <span className="min-w-0 flex-1 truncate">{option.salonName}</span>
              {option.salonId === selected && (
                <Check className="size-4 text-primary" aria-hidden />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      {matches.length > rows.length && (
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          Showing {rows.length} of {matches.length}. Type to find the rest.
        </p>
      )}
    </Command>
  );
}

/**
 * The owner's "All branches / one branch" choice in the dashboard top bar.
 * Two or more branches: a searchable picker. One: its name as a label. None: nothing.
 * The choice lives in the `sm_branch` cookie, so after saving it the page is
 * refreshed to re-render its server components with the new branch.
 */
export function BranchSwitcher({
  branches,
  selected,
  allowAll = true,
}: {
  branches: BranchOption[];
  selected: string;
  /** False for a manager: they work one branch at a time, never "All branches". */
  allowAll?: boolean;
}) {
  const router = useRouter();
  // Shows the new choice while it saves; the server's value wins afterwards.
  const [value, setValue] = useOptimistic(selected);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (branches.length === 0) return null;

  if (branches.length === 1) {
    return (
      <span className="hidden max-w-[12rem] items-center gap-1.5 truncate text-sm font-medium text-muted-foreground sm:flex">
        <Store className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{branches[0].salonName}</span>
      </span>
    );
  }

  const options = [
    ...(allowAll ? [{ salonId: "all", salonName: "All branches" }] : []),
    ...branches,
  ];
  const currentName = options.find((option) => option.salonId === value)?.salonName;

  const onChange = (next: string) => {
    setOpen(false);
    if (next === value) return;
    startTransition(async () => {
      setValue(next);
      await setSelectedBranch(next);
      // Re-reads the cookie on the server; no data changed, so no tag to update.
      router.refresh();
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Branch: ${currentName ?? "none chosen"}`}
        disabled={pending}
        className="flex h-10 w-auto max-w-[10rem] shrink-0 items-center gap-1.5 rounded-full border border-input bg-surface px-3.5 text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-[14rem] md:text-sm"
      >
        <Store className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className={cn("truncate", !currentName && "text-muted-foreground")}>
          {currentName ?? "Choose a branch"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl p-0"
      >
        <BranchList options={options} selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  );
}
