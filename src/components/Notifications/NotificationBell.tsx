"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClock } from "@/components/Admin/useClock";
import { cn } from "@/lib/utils";
import { getNotifications } from "@/services/notifications/getNotifications";
import { markNotificationsRead } from "@/services/notifications/markNotificationsRead";
import type { AppNotification } from "@/services/notifications/notification-types";
import { timeAgo } from "./notification-format";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const POLL_MS = 60_000;
const SHOWN = 10;

/**
 * The business top bar's bell: unread count, the latest 10, "Mark all read".
 * Light polling - every 60 s while the tab is visible, again when it comes
 * back, and on open. No websocket.
 */
export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, startLoading] = useTransition();
  const [marking, startMarking] = useTransition();
  const now = useClock();
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const result = await getNotifications({ limit: SHOWN });
      if (result.success && result.data) {
        setItems(result.data.items);
        setUnread(result.data.unread);
        setLoaded(true);
      }
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const onOpenChange = (open: boolean) => {
    if (open) startLoading(refresh);
  };

  const markAll = () =>
    startMarking(async () => {
      const before = { items, unread };
      setItems((rows) => rows.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
      setUnread(0);
      const result = await markNotificationsRead({ all: true });
      if (!result.success) {
        setItems(before.items);
        setUnread(before.unread);
        toast.error(result.message || "Couldn't mark them as read.");
      }
    });

  const open = (n: AppNotification) => {
    if (n.readAt) return;
    setItems((rows) => rows.map((r) => (r.id === n.id ? { ...r, readAt: new Date().toISOString() } : r)));
    setUnread((u) => Math.max(u - 1, 0));
    void markNotificationsRead({ ids: [n.id] });
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications: ${unread} unread` : "Notifications"}
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            FOCUS_RING,
          )}
        >
          <Bell aria-hidden="true" className="size-4.5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] leading-5 font-bold text-white tabular-nums">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] rounded-xl p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="flex items-center gap-2">
            {loading && <Loader2 aria-label="Refreshing" className="size-4 animate-spin text-muted-foreground" />}
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0 || marking}
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium text-primary-hover hover:bg-primary-soft disabled:pointer-events-none disabled:opacity-50",
                FOCUS_RING,
              )}
            >
              Mark all read
            </button>
          </div>
        </div>
        {!loaded ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.map((n) => {
              const body = (
                <>
                  <span
                    aria-hidden="true"
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate", n.readAt ? "text-foreground" : "font-semibold")}>
                      {n.title}
                    </span>
                    <span className="line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                    {now !== null && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt, now)}</span>
                    )}
                  </span>
                  {!n.readAt && <span className="sr-only">Unread</span>}
                </>
              );
              const rowClass = cn("flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-surface-subtle", FOCUS_RING);
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => open(n)} className={rowClass}>
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => open(n)} className={rowClass}>
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-border p-2">
          <Link
            href="/dashboard/notifications"
            className={cn(
              "block rounded-lg px-2 py-2 text-center text-sm font-medium text-primary-hover hover:bg-primary-soft",
              FOCUS_RING,
            )}
          >
            See all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
