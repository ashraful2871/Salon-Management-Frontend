"use client";

import Link from "next/link";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";

export type HomeBookingsTab = "upcoming" | "past" | "addresses";

const TABS: { key: HomeBookingsTab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "addresses", label: "Addresses" },
];

/** `?tab=`: each is its own server read, so the switch keeps the current tab (dimmed) until the next is ready. */
export function HomeBookingTabs({ current }: { current: HomeBookingsTab }) {
  const { navigate } = useFilterNavigation();

  return (
    <nav aria-label="Home bookings sections">
      <ul className="flex w-fit gap-1 rounded-full bg-muted p-1">
        {TABS.map((t) => {
          const href = t.key === "upcoming" ? "/dashboard/home-bookings" : `/dashboard/home-bookings?tab=${t.key}`;
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
                  "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
