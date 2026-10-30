"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HOME_BASE } from "./format";

const TABS = [
  { href: HOME_BASE, label: "Setup" },
  { href: `${HOME_BASE}/settings`, label: "Settings" },
  { href: `${HOME_BASE}/menu`, label: "Menu" },
  { href: `${HOME_BASE}/experts`, label: "Experts" },
  { href: `${HOME_BASE}/bookings`, label: "Bookings" },
  { href: `${HOME_BASE}/policy`, label: "Policy" },
] as const;

/** The branch's Home Service sections. Scrolls sideways inside its own strip on a phone. */
export function OwnerHomeTabs() {
  const pathname = usePathname();
  const current =
    [...TABS].reverse().find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.href ?? TABS[0].href;

  return (
    <nav aria-label="Home Service sections" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {TABS.map((t) => {
          const active = t.href === current;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
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
