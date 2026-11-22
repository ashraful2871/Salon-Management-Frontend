"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/admin/referrals";

const TABS = [
  { href: BASE, label: "Overview" },
  { href: `${BASE}/list`, label: "Referrals" },
  { href: `${BASE}/rewards`, label: "Rewards" },
  { href: `${BASE}/review`, label: "Review", needs: ["referrals.manage"] },
  // The page reads GET /admin/settings (settings.view); referrals.policy edits it.
  { href: `${BASE}/settings`, label: "Settings", needs: ["referrals.policy", "settings.view"] },
] as const;

/**
 * The segment's pill tabs (Analytics' look). Review shows with
 * referrals.manage, Settings with referrals.policy or settings.view; the
 * pages guard themselves too. Scrolls sideways inside its strip on a phone.
 */
export function ReferralTabs({ permissions, reviewCount = 0 }: { permissions: string[]; reviewCount?: number }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => !("needs" in t) || t.needs.some((p) => can(permissions, p)));

  return (
    <nav aria-label="Referral sections" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {tabs.map((t) => {
          const active = t.href === BASE ? pathname === BASE : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.label === "Review" && reviewCount > 0 && (
                  <span className="rounded-full bg-warning-soft px-1.5 text-xs font-semibold text-warning tabular-nums">
                    {reviewCount}
                    <span className="sr-only"> waiting</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
