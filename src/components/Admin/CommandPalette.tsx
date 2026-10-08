"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CornerDownLeft,
  Loader2,
  ReceiptText,
  Store,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchAdmin } from "@/services/admin/searchAdmin";
import type { AdminSearchHit } from "@/services/admin/types";

export type PalettePage = { href: string; label: string; icon: LucideIcon };

const KIND: Record<AdminSearchHit["kind"], { title: string; icon: LucideIcon }> = {
  user: { title: "Users", icon: User },
  salon: { title: "Salons", icon: Store },
  booking: { title: "Bookings", icon: CalendarCheck },
  intent: { title: "Top-ups", icon: Wallet },
  payout: { title: "Payouts", icon: ReceiptText },
};
const KIND_ORDER = Object.keys(KIND) as AdminSearchHit["kind"][];

const DEBOUNCE_MS = 250;

/**
 * The admin's Ctrl/⌘K palette: the pages they can open, plus `GET
 * /admin/search` (users by email or phone, salons, bookings by `TKN-…`,
 * top-ups and payouts by id) through a Server Action, debounced. cmdk handles
 * the arrows and Enter; the API does the matching, so cmdk's own filter is off.
 */
export function CommandPalette({
  open,
  onOpenChange,
  pages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PalettePage[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Only the latest request may write its answer.
  const latest = useRef(0);

  // Ctrl/⌘K toggles from anywhere in the dashboard.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    const term = query.trim();
    const id = ++latest.current;
    if (term.length < 2) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await searchAdmin(term);
        if (id !== latest.current) return;
        setHits(result.success ? (result.data ?? []) : []);
        setError(result.success ? null : result.message);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  const term = query.trim().toLowerCase();
  const matchingPages = term
    ? pages.filter((p) => p.label.toLowerCase().includes(term))
    : pages;
  const searching = term.length >= 2;
  // A short query shows pages only; stale hits from a longer one are ignored.
  const shown = searching ? hits : [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search the back office"
      description="Find a user, salon, booking or page"
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search users, salons, TKN-…"
      />
      <CommandList>
        {searching && !pending && shown.length === 0 && matchingPages.length === 0 && (
          <CommandEmpty>{error ?? "No matches."}</CommandEmpty>
        )}
        {pending && (
          <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Searching…
          </p>
        )}
        {KIND_ORDER.map((kind) => {
          const group = shown.filter((h) => h.kind === kind);
          if (group.length === 0) return null;
          const { title, icon: Icon } = KIND[kind];
          return (
            <CommandGroup key={kind} heading={title}>
              {group.map((hit) => (
                <CommandItem
                  key={`${hit.kind}-${hit.id}`}
                  value={`${hit.kind}-${hit.id}`}
                  onSelect={() => go(hit.href)}
                >
                  <Icon aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{hit.title}</span>
                    {hit.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {hit.subtitle}
                      </span>
                    )}
                  </span>
                  <CornerDownLeft aria-hidden="true" className="text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        {matchingPages.length > 0 && (
          <CommandGroup heading="Pages">
            {matchingPages.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={`page-${href}`} onSelect={() => go(href)}>
                <Icon aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
