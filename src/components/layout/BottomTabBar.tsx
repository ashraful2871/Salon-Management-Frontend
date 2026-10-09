"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { Ref } from "react";
import { cn } from "@/lib/utils";
import { NavLinkPending } from "@/components/Shared/NavLinkPending";
import type { UserRole } from "@/services/auth/auth-utils";
import { labelFor, type NavItem } from "./dashboard-nav";

// Static so Tailwind sees every class; a role has at most 4 tabs plus More.
const COLS = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4", "grid-cols-5"];

const TAB =
  "relative flex h-full min-w-0 flex-col items-center justify-center gap-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

const TabIcon = ({ icon: Icon, active }: { icon: NavItem["icon"]; active: boolean }) => (
  <span
    className={cn(
      "grid h-7 w-12 place-items-center rounded-full transition-colors",
      active && "bg-primary-soft text-primary-hover",
    )}
  >
    <Icon className="size-5" aria-hidden="true" />
  </span>
);

/**
 * The phone navigation (below lg): the role's key pages one tap away, and
 * "More", which opens the full drawer. The content frame pads its bottom by
 * the bar's height so nothing ends up underneath it.
 */
export function BottomTabBar({
  tabs,
  active,
  role,
  moreOpen,
  onMore,
  moreRef,
}: {
  tabs: NavItem[];
  active: string | undefined;
  role: UserRole;
  moreOpen: boolean;
  onMore: () => void;
  moreRef: Ref<HTMLButtonElement>;
}) {
  // A page with no tab of its own (Settings, Earnings...) lights up More.
  const moreActive = !tabs.some((tab) => tab.path === active);

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className={cn("grid h-16", COLS[tabs.length + 1])}>
        {tabs.map((tab) => {
          const isActive = tab.path === active;
          return (
            <li key={tab.path} className="min-w-0">
              <Link
                href={tab.tabHref ?? tab.path}
                aria-current={isActive ? "page" : undefined}
                className={TAB}
              >
                <TabIcon icon={tab.icon} active={isActive} />
                <span
                  className={cn(
                    "max-w-full truncate px-1 text-[11px] font-medium",
                    isActive && "text-primary-hover",
                  )}
                >
                  {tab.short ?? labelFor(tab, role)}
                </span>
                <NavLinkPending className="absolute left-1/2 top-2 ml-5" />
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <button
            ref={moreRef}
            type="button"
            onClick={onMore}
            aria-controls="dashboard-drawer"
            aria-expanded={moreOpen}
            className={cn(TAB, "w-full cursor-pointer")}
          >
            <TabIcon icon={Menu} active={moreActive} />
            <span
              className={cn(
                "max-w-full truncate px-1 text-[11px] font-medium",
                moreActive && "text-primary-hover",
              )}
            >
              More
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
