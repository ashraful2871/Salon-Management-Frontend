"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { Bell, Loader2, Search, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { loadAdminInbox } from "@/services/admin/loadAdminInbox";
import type { AdminInboxItem } from "@/services/admin/types";
import { CommandPalette, type PalettePage } from "./CommandPalette";
import { inboxAge, inboxLabel, inboxTotal } from "./inbox";
import { useClock } from "./useClock";

/** What the dashboard layout reads for an ADMIN or AGENT, once per full render. */
export type AdminShellData = {
  permissions: string[];
  stepUpUntil: string | null;
  inbox: AdminInboxItem[] | null;
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const useIsMac = () =>
  useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

const ENV_LABEL = process.env.NEXT_PUBLIC_ENV_LABEL ?? "LOCAL";

const envTone = (label: string) =>
  /prod/i.test(label) ? TONE_CLASSES.danger : /local|dev/i.test(label) ? TONE_CLASSES.neutral : TONE_CLASSES.warning;

function StepUpChip({ until }: { until: string | null }) {
  const now = useClock();
  if (!until || now === null) return null;
  const minutes = Math.ceil((new Date(until).getTime() - now) / 60_000);
  if (minutes <= 0) return null;
  return (
    <span
      title="Recently confirmed with your 2FA code: sensitive actions won't ask again until this runs out"
      className={cn(
        "hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold md:inline-flex",
        TONE_CLASSES.success.soft,
        TONE_CLASSES.success.text,
      )}
    >
      <ShieldCheck aria-hidden="true" className="size-3.5" />
      2FA ✓ {minutes} min
    </span>
  );
}

function AttentionBell({ initial }: { initial: AdminInboxItem[] | null }) {
  // A fresh read replaces the layout's copy only until the layout sends a newer one.
  const [fresh, setFresh] = useState<{ from: AdminInboxItem[] | null; items: AdminInboxItem[] } | null>(null);
  const [pending, startTransition] = useTransition();
  const now = useClock();
  const items = fresh && fresh.from === initial ? fresh.items : (initial ?? []);
  const total = inboxTotal(items);

  const onOpenChange = (open: boolean) => {
    if (!open) return;
    startTransition(async () => {
      const result = await loadAdminInbox();
      if (result.success) setFresh({ from: initial, items: result.data ?? [] });
    });
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={total > 0 ? `Needs attention: ${total}` : "Needs attention: nothing open"}
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            FOCUS_RING,
          )}
        >
          <Bell aria-hidden="true" className="size-4.5" />
          {total > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] leading-5 font-bold text-white tabular-nums">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(22rem,calc(100vw-2rem))] rounded-xl p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Needs attention</p>
          {pending && <Loader2 aria-label="Refreshing" className="size-4 animate-spin text-muted-foreground" />}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            ✓ Nothing needs you right now
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.map((item) => {
              const age = now === null ? null : inboxAge(item, now);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={cn("flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-subtle", FOCUS_RING)}
                  >
                    <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", TONE_CLASSES[item.tone].dot)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{inboxLabel(item.key)}</span>
                      {age && <span className="block text-xs text-muted-foreground">{age}</span>}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{item.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The top bar's back-office extras for ADMIN and AGENT: search (opens the
 * Ctrl/⌘K palette), the 2FA step-up window, the environment, and the
 * "Needs attention" bell.
 */
export function AdminTopBar({ data, pages }: { data: AdminShellData; pages: PalettePage[] }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isMac = useIsMac();
  const env = envTone(ENV_LABEL);

  return (
    <>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search users, salons, TKN-…"
        aria-keyshortcuts="Control+K Meta+K"
        className={cn(
          "flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          FOCUS_RING,
        )}
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden xl:inline">Search users, salons, TKN-…</span>
        <kbd className="hidden rounded border border-border bg-surface-subtle px-1.5 font-sans text-[11px] font-medium lg:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <StepUpChip until={data.stepUpUntil} />
      <span
        title="Environment"
        className={cn(
          "hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase sm:inline-block",
          env.soft,
          env.text,
        )}
      >
        {ENV_LABEL}
      </span>
      <AttentionBell initial={data.inbox} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} pages={pages} />
    </>
  );
}
