"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NavLinkPending } from "@/components/Shared/NavLinkPending";
import { UserRole } from "@/services/auth/auth-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLE_HOME } from "@/lib/route-access";
import { AdminTopBar, type AdminShellData } from "@/components/Admin/AdminTopBar";
import LogoutButton from "./LogoutButton";
import { BottomTabBar } from "./BottomTabBar";
import {
  activeItem,
  labelFor,
  navGroupsFor,
  pageTrail,
  tabsFor,
  type NavGroup,
} from "./dashboard-nav";

/** The cookie the layout reads so the sidebar renders collapsed on the server. */
const SIDEBAR_COOKIE = "sm_sidebar";

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  STAFF: "Staff",
  SALON_OWNER: "Salon Owner",
  ADMIN: "Admin",
  AGENT: "Agent",
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

type ShellUser = { role: UserRole; name: string; email: string };

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SidebarNav = ({
  groups,
  role,
  active,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  role: UserRole;
  active: string | undefined;
  collapsed: boolean;
  onNavigate?: () => void;
}) => (
  <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 pb-4 pt-3">
    {groups.map((group, index) => (
      <Fragment key={group.title ?? index}>
        {group.title && !collapsed && (
          <p
            aria-hidden="true"
            className="mb-1.5 mt-5 px-3 text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            {group.title}
          </p>
        )}
        {collapsed && index > 0 && (
          <div aria-hidden="true" className="mx-3 my-3 h-px bg-border" />
        )}
        <ul aria-label={group.title} className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = item.path === active;
            const label = labelFor(item, role);
            const link = (
              <Link
                href={item.path}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  FOCUS_RING,
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary-soft font-semibold text-primary-hover"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold"
                  />
                )}
                <item.icon aria-hidden="true" className="size-[18px] shrink-0" />
                {collapsed ? (
                  <>
                    <span className="sr-only">{label}</span>
                    <NavLinkPending className="absolute right-1.5 top-1.5" />
                  </>
                ) : (
                  <>
                    <span className="truncate">{label}</span>
                    <NavLinkPending className="ml-auto" />
                  </>
                )}
              </Link>
            );
            return (
              <li key={item.path}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </Fragment>
    ))}
  </nav>
);

const SidebarFooter = ({
  user,
  collapsed,
}: {
  user: ShellUser;
  collapsed: boolean;
}) => (
  <div className="space-y-2 border-t border-border p-3">
    {!collapsed && (
      <div className="flex items-center gap-3 rounded-xl bg-surface-subtle p-2.5">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-gold text-xs font-bold text-white">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        </div>
      </div>
    )}
    <LogoutButton iconOnly={collapsed} />
  </div>
);

const Logo = ({ collapsed }: { collapsed: boolean }) => (
  <Link
    href="/"
    className={cn("flex min-w-0 items-center gap-2 rounded-lg", FOCUS_RING)}
    aria-label="SalonKhuji home"
  >
    {/* sizes is the rendered width, so a 32 px logo doesn't pull a 1920 w file. */}
    {collapsed ? (
      <Image
        src="/favicon.png"
        alt="SalonKhuji"
        width={476}
        height={315}
        sizes="55px"
        className="h-9 w-auto object-contain"
      />
    ) : (
      <Image
        src="/salon-logo.png"
        alt="SalonKhuji"
        width={1534}
        height={326}
        sizes="151px"
        className="h-8 w-auto object-contain"
      />
    )}
  </Link>
);

/**
 * The dashboard frame: sidebar, top bar, bottom tabs and content.
 *
 * - lg and up: the grouped sidebar is fixed on the left and collapses to
 *   icons (remembered in a cookie, so the server renders it that way); the top
 *   bar carries the breadcrumb.
 * - Below lg: a bottom tab bar holds the role's key pages, and its "More"
 *   opens the full nav as a drawer; the top bar shows just the page title.
 *
 * The page scrolls the window, not an inner box, so phones can hide their
 * browser chrome while scrolling and `position: sticky` behaves normally.
 */
export const DashboardShell = ({
  user,
  initialCollapsed = false,
  admin,
  children,
}: {
  user: ShellUser;
  initialCollapsed?: boolean;
  /** ADMIN and AGENT only: permissions for the nav, plus the top-bar extras. */
  admin?: AdminShellData;
  children: ReactNode;
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  const groups = navGroupsFor(user.role, admin?.permissions, { approvals: admin?.approvals });
  const items = groups.flatMap((g) => g.items);
  const active = activeItem(pathname, items)?.path;
  const { trail, title } = pageTrail(pathname, items, user.role);
  const tabs = tabsFor(user.role, admin?.permissions);
  const home = ROLE_HOME[user.role];

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  };

  // A navigation closes the drawer, including back/forward.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const moreButton = moreRef.current;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      moreButton?.focus({ preventScroll: true });
    };
  }, [mobileOpen]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => query.matches && setMobileOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-300 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Logo collapsed={collapsed} />
        </div>
        <TooltipProvider delayDuration={200}>
          <SidebarNav
            groups={groups}
            role={user.role}
            active={active}
            collapsed={collapsed}
          />
        </TooltipProvider>
        <SidebarFooter user={user} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer, opened by the tab bar's "More" */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-[visibility] duration-300 lg:hidden",
          mobileOpen ? "visible" : "invisible",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 cursor-default bg-black/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          id="dashboard-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard menu"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <Logo collapsed={false} />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className={cn(
                "grid h-10 w-10 cursor-pointer place-items-center rounded-full text-foreground hover:bg-muted",
                FOCUS_RING,
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav
            groups={groups}
            role={user.role}
            active={active}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
          <div className="border-t border-border px-3 pt-3">
            <Link
              href="/"
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                FOCUS_RING,
              )}
            >
              <Home aria-hidden="true" className="size-[18px]" />
              Back to website
            </Link>
          </div>
          <div className="pb-[env(safe-area-inset-bottom)]">
            <SidebarFooter user={user} collapsed={false} />
          </div>
        </aside>
      </div>

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 lg:pb-0",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 sm:px-6 md:backdrop-blur-sm lg:h-16 lg:px-8">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "-ml-2 hidden h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground lg:grid",
              FOCUS_RING,
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <Breadcrumb className="hidden min-w-0 flex-1 lg:block">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                {trail.length === 0 ? (
                  <BreadcrumbPage className="font-medium">Dashboard</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={home}>Dashboard</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {trail.map((crumb) => (
                <Fragment key={crumb.label}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    {crumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="truncate font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <p className="min-w-0 flex-1 truncate text-base font-semibold text-foreground lg:hidden">
            {title}
          </p>

          {admin && (
            <AdminTopBar
              data={admin}
              pages={items.map((item) => ({
                href: item.path,
                label: labelFor(item, user.role),
                icon: item.icon,
              }))}
            />
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Account menu for ${user.name}`}
                className={cn(
                  "flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface p-1 transition-colors hover:bg-muted md:pr-3",
                  FOCUS_RING,
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-gold text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-foreground md:block">
                  {user.name}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl p-1.5">
              <DropdownMenuLabel className="p-2.5">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-hover">
                  {roleLabel}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                <Link href="/my-profile">
                  <User className="mr-2 h-4 w-4" /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" /> Back to website
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1680px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>

      <BottomTabBar
        tabs={tabs}
        active={active}
        role={user.role}
        moreOpen={mobileOpen}
        onMore={() => setMobileOpen(true)}
        moreRef={moreRef}
      />
    </div>
  );
};
