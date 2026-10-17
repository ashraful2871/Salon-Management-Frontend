"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/Shared/EmptyState";
import { useClock } from "@/components/Admin/useClock";
import { cn } from "@/lib/utils";
import { getNotifications } from "@/services/notifications/getNotifications";
import { markNotificationsRead } from "@/services/notifications/markNotificationsRead";
import type { AppNotification } from "@/services/notifications/notification-types";
import { timeAgo } from "./notification-format";

/**
 * The bell's full list: newest first, "Load more" by cursor, `?show=unread`
 * for unread only. Opening a row marks it read; "Mark all read" does the rest.
 */
export function NotificationsClient({
  initial,
  nextCursor: initialCursor,
  unread: initialUnread,
  unreadOnly,
}: {
  initial: AppNotification[];
  nextCursor: string | null;
  unread: number;
  unreadOnly: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, startLoading] = useTransition();
  const [marking, startMarking] = useTransition();
  const now = useClock();

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const result = await getNotifications({ cursor, unread: unreadOnly });
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more.");
        return;
      }
      setItems((rows) => [...rows, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  const stamp = () => new Date().toISOString();

  const markAll = () =>
    startMarking(async () => {
      const before = { items, unread };
      setItems((rows) => rows.map((n) => (n.readAt ? n : { ...n, readAt: stamp() })));
      setUnread(0);
      const result = await markNotificationsRead({ all: true });
      if (!result.success) {
        setItems(before.items);
        setUnread(before.unread);
        toast.error(result.message || "Couldn't mark them as read.");
      }
    });

  const markOne = (n: AppNotification) => {
    if (n.readAt) return;
    setItems((rows) => rows.map((r) => (r.id === n.id ? { ...r, readAt: stamp() } : r)));
    setUnread((u) => Math.max(u - 1, 0));
    void markNotificationsRead({ ids: [n.id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Show">
          {[
            { href: "/dashboard/notifications", label: "All", active: !unreadOnly },
            { href: "/dashboard/notifications?show=unread", label: `Unread${unread ? ` (${unread})` : ""}`, active: unreadOnly },
          ].map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              aria-current={chip.active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                chip.active
                  ? "border-primary bg-primary-soft text-primary-hover"
                  : "border-border bg-surface text-muted-foreground hover:bg-muted",
              )}
            >
              {chip.label}
            </Link>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={markAll} disabled={unread === 0 || marking}>
          Mark all read
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "Nothing unread" : "No notifications yet"}
          description="New bookings, cancellations, reviews and payouts show up here."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {items.map((n) => {
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("block", n.readAt ? "font-medium" : "font-semibold")}>{n.title}</span>
                  <span className="block text-sm text-muted-foreground">{n.body}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {now === null ? "" : timeAgo(n.createdAt, now)}
                </span>
                {!n.readAt && <span className="sr-only">Unread</span>}
              </>
            );
            const rowClass =
              "flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} onClick={() => markOne(n)} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={() => markOne(n)} className={rowClass}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
