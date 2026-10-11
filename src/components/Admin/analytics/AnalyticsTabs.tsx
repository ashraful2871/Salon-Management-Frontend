"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import { ANALYTICS_TABS, type AnalyticsTab } from "./tabs";

/**
 * `?tab=` keeps the filters; each tab is its own server fetch, so the switch
 * runs in the shared transition and the current tab stays (dimmed) meanwhile.
 * Scrolls sideways inside its own strip on a phone.
 */
export function AnalyticsTabs({ current }: { current: AnalyticsTab }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate } = useFilterNavigation();

  const hrefFor = (key: string) => {
    const next = new URLSearchParams(params.toString());
    if (key === "overview") next.delete("tab");
    else next.set("tab", key);
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav aria-label="Analytics sections" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {ANALYTICS_TABS.map((t) => {
          const href = hrefFor(t.key);
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
