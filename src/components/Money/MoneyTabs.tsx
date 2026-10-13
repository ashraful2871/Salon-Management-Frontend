"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/money", label: "Overview" },
  { href: "/dashboard/money/transactions", label: "Transactions" },
  { href: "/dashboard/money/payouts", label: "Payouts" },
  { href: "/dashboard/money/payout-settings", label: "Payout settings" },
] as const;

/** The Money hub's sections. Scrolls sideways inside its own strip on a phone. */
export function MoneyTabs() {
  const pathname = usePathname();
  const current =
    [...TABS].reverse().find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
      ?.href ?? TABS[0].href;

  return (
    <nav aria-label="Money sections" className="-mx-1 overflow-x-auto px-1 pb-1">
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
