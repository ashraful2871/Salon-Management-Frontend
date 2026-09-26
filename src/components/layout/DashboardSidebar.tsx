"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  CalendarClock,
  Users,
  Package,
  Settings,
  Store,
  ShieldCheck,
  Wallet,
  DollarSign,
  ReceiptText,
  UserCog,
  ClipboardCheck,
  FileClock,
  Home,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/services/auth/auth-utils";
import { rolesForPath } from "@/lib/route-access";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "./LogoutButton";

/**
 * The dashboard navigation. Labels and icons live here; who may see each link
 * does not - `rolesForPath` reads it off the same table the route guards
 * enforce, so a link is drawn exactly when its destination would open.
 */
const menuItems: { icon: LucideIcon; label: string; path: string }[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Appointments", path: "/dashboard/appointments" },
  { icon: CalendarClock, label: "Slot Management", path: "/dashboard/slots" },
  { icon: Users, label: "Customers", path: "/dashboard/customers" },
  { icon: Package, label: "Services", path: "/dashboard/services" },
  { icon: Store, label: "My Salon", path: "/dashboard/store" },
  { icon: ShieldCheck, label: "Admin Panel", path: "/dashboard/admin" },
  { icon: UserCog, label: "Agents", path: "/dashboard/admin/agents" },
  {
    icon: ReceiptText,
    label: "Top-ups & Refunds",
    path: "/dashboard/admin/topups",
  },
  { icon: Wallet, label: "Wallet", path: "/dashboard/wallet" },
  { icon: DollarSign, label: "Earnings", path: "/dashboard/earnings" },
  {
    icon: Scissors,
    label: "Become a Salon Owner",
    path: "/dashboard/become-a-salon-owner-request",
  },
  {
    icon: ClipboardCheck,
    label: "Approval Salon",
    path: "/dashboard/approval-salon",
  },
  {
    icon: FileClock,
    label: "Applications Status",
    path: "/dashboard/applications-status",
  },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

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

/** The item whose path is the longest prefix of the current one. */
const activePath = (pathname: string, paths: string[]) =>
  paths
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];

const SidebarNav = ({
  items,
  active,
  collapsed,
  onNavigate,
}: {
  items: typeof menuItems;
  active: string | undefined;
  collapsed: boolean;
  onNavigate?: () => void;
}) => (
  <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-4">
    {!collapsed && (
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Menu
      </p>
    )}
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = item.path === active;
        return (
          <li key={item.path}>
            <Link
              href={item.path}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold"
                />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-gold-dark" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                )}
              />
              {collapsed ? (
                <span className="sr-only">{item.label}</span>
              ) : (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

const SidebarFooter = ({
  user,
  collapsed,
}: {
  user: ShellUser;
  collapsed: boolean;
}) => (
  <div className="space-y-2 border-t border-sidebar-border p-3">
    {!collapsed && (
      <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-gold text-xs font-bold text-white">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {user.name}
          </p>
          <p className="truncate text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
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
    className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
    aria-label="SalonKhuji home"
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={collapsed ? "/favicon.png" : "/salon-logo.png"}
      alt="SalonKhuji"
      className={cn("w-auto object-contain", collapsed ? "h-9" : "h-8")}
    />
  </Link>
);

/**
 * The dashboard frame: sidebar, top bar and content.
 *
 * - lg and up: the sidebar is fixed on the left and collapses to icons; the
 *   content's left padding follows it, so nothing sits underneath.
 * - Below lg: the sidebar is a drawer behind the top bar's menu button, and
 *   the content takes the full width.
 *
 * The page scrolls the window, not an inner box, so phones can hide their
 * browser chrome while scrolling and `position: sticky` behaves normally.
 */
export const DashboardShell = ({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  const items = menuItems.filter((item) =>
    rolesForPath(item.path)?.includes(user.role),
  );
  const active = activePath(
    pathname,
    items.map((i) => i.path),
  );
  const current = items.find((i) => i.path === active);

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
    const menuButton = menuRef.current;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      menuButton?.focus({ preventScroll: true });
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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Logo collapsed={collapsed} />
        </div>
        <SidebarNav items={items} active={active} collapsed={collapsed} />
        <SidebarFooter user={user} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
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
            "absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          id="dashboard-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard menu"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-sidebar shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
            <Logo collapsed={false} />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav
            items={items}
            active={active}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
          <div className="border-t border-sidebar-border px-3 pt-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
            >
              <Home className="h-5 w-5 text-sidebar-foreground/60" />
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
          "flex min-h-screen min-w-0 flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            ref={menuRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open dashboard menu"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-drawer"
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:grid"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="hidden text-[11px] font-medium uppercase tracking-wider text-slate-400 sm:block">
              Dashboard
            </p>
            <p className="truncate text-base font-semibold leading-tight text-slate-900">
              {current?.label ?? "Dashboard"}
            </p>
          </div>

          <Link
            href="/"
            className="hidden h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:inline-flex"
          >
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Back to website</span>
          </Link>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Account menu for ${user.name}`}
                className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white p-1 transition-all hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:pr-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-gold text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-900 md:block">
                  {user.name}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl p-1.5">
              <DropdownMenuLabel className="p-2.5">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
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

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
