"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  Mail,
  Menu,
  Sparkles,
  Store,
  User,
  UserPlus,
  Wallet as WalletIcon,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Wallet } from "@/services/wallet/getMyWallet";
import LogoutButton from "./LogoutButton";
import WalletMenu from "./WalletMenu";
import BalanceReveal from "@/components/Shared/BalanceReveal";
import LocationChip from "@/components/Location/LocationChip";

interface UserData {
  role: string;
  email: string;
  name: string;
}

interface NavbarClientProps {
  user: UserData | null;
  /** Null when signed out, or when the wallet read failed. */
  wallet: Wallet | null;
  ownerRevenueMinor?: number | null;
  adminRevenueMinor?: number | null;
  /** The Suspense fallback: who is signed in isn't known yet. */
  accountLoading?: boolean;
}

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/salons", label: "Salons", icon: Store },
  { href: "/ai-suggestions", label: "AI Match", icon: Sparkles },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
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

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

const UserAvatar = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => (
  <Avatar className={cn("h-8 w-8", className)}>
    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);

const NavbarClient = ({
  user,
  wallet,
  ownerRevenueMinor,
  adminRevenueMinor,
  accountLoading = false,
}: NavbarClientProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // A flat header over the hero, a lifted one once the page moves under it.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The drawer is a route-level overlay, so a navigation has to dismiss it —
  // including a back/forward move, which no link handler sees. Adjusting during
  // render rather than in an effect keeps it to a single render pass.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setIsMobileMenuOpen(false);
  }

  // While the drawer is open it owns the viewport: lock the page behind it,
  // move focus into it, and let Escape close it. Focus goes back to the menu
  // button when it closes.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const menuButton = menuButtonRef.current;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      menuButton?.focus({ preventScroll: true });
    };
  }, [isMobileMenuOpen]);

  // The drawer is only for phones and tablets: widening the window past lg
  // with it open would otherwise leave the page scroll-locked.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => query.matches && setIsMobileMenuOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const closeMenu = () => setIsMobileMenuOpen(false);
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";

  // The account pages each role has, shared by the dropdown and the drawer.
  // No amounts here: balances only ever show through BalanceReveal.
  const accountLinks: { href: string; label: string; icon: LucideIcon }[] = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ...(user.role === "CUSTOMER"
          ? [{ href: "/dashboard/wallet", label: "My wallet", icon: WalletIcon }]
          : []),
        ...(user.role === "SALON_OWNER"
          ? [{ href: "/dashboard/earnings", label: "Earnings", icon: WalletIcon }]
          : []),
        { href: "/my-profile", label: "My profile", icon: User },
      ]
    : [];

  return (
    <>
      <header
        className={cn(
          // Only colours and the shadow change on scroll; the blur keeps one
          // radius and is desktop-only, so phones never re-rasterise it.
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200",
          isScrolled
            ? "border-border bg-surface/95 shadow-xs md:bg-surface/85 md:backdrop-blur-sm"
            : "border-transparent bg-surface/90 md:bg-surface/75 md:backdrop-blur-sm",
        )}
      >
        <nav
          aria-label="Main navigation"
          className="container mx-auto px-4 sm:px-6"
        >
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-3">
            {/* Logo */}
            <Link
              href="/"
              className="group flex min-w-0 shrink items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="SalonKhuji home"
            >
              <Image
                src="/salon-logo.png"
                alt="SalonKhuji Logo"
                width={1534}
                height={326}
                sizes="(min-width: 1280px) 188px, (min-width: 640px) 170px, 151px"
                preload
                className="h-7 w-auto max-w-[140px] object-contain transition-transform group-hover:scale-105 min-[400px]:h-8 min-[400px]:max-w-none sm:h-9 xl:h-10"
              />
            </Link>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-1 rounded-full border border-border bg-muted/70 p-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 xl:px-4",
                    isActive(link.href)
                      ? "bg-surface text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right cluster */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              {/* Widest to narrowest: full label, short label, icon. Between
                  lg and xl the desktop links need the room, so it shrinks
                  back to the icon there. */}
              <LocationChip className="hidden 2xl:inline-flex" />
              <LocationChip
                variant="compact"
                className="hidden sm:inline-flex lg:hidden xl:inline-flex 2xl:hidden"
              />
              <LocationChip variant="icon" className="sm:hidden lg:grid xl:hidden" />

              {accountLoading ? (
                // Fixed sizes, so nothing shifts when the account streams in.
                <div aria-hidden="true" className="flex items-center gap-1.5 sm:gap-2.5">
                  <Skeleton className="hidden h-10 w-36 rounded-full md:block" />
                  <Skeleton className="size-10 rounded-full" />
                </div>
              ) : user ? (
                <>
                  {/* Balance: from md up; smaller screens have it in the drawer. */}
                  <div className="hidden md:block">
                    {user.role === "CUSTOMER" && <WalletMenu wallet={wallet} />}
                    {user.role === "SALON_OWNER" && (
                      <BalanceReveal
                        variant="pill"
                        label="Owner revenue"
                        figures={[
                          { label: "Net earnings", amountMinor: ownerRevenueMinor ?? null },
                        ]}
                      />
                    )}
                    {user.role === "ADMIN" && (
                      <BalanceReveal
                        variant="pill"
                        label="Platform revenue"
                        figures={[
                          { label: "Total", amountMinor: adminRevenueMinor ?? null },
                        ]}
                      />
                    )}
                  </div>

                  {/* Account menu: avatar + name (+ role from xl) on desktop,
                      the avatar alone on smaller screens. */}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Account menu for ${user.name}`}
                        className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface p-1 transition-[border-color,box-shadow] hover:border-input hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:border-primary/40 data-[state=open]:ring-1 data-[state=open]:ring-primary/10 lg:pr-3"
                      >
                        <UserAvatar name={user.name} />
                        <span className="hidden max-w-[6rem] flex-col items-start leading-none lg:flex xl:max-w-[9rem]">
                          <span className="w-full truncate text-sm font-semibold text-foreground">
                            <span className="xl:hidden">{firstName(user.name)}</span>
                            <span className="hidden xl:inline">{user.name}</span>
                          </span>
                          <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground xl:block">
                            {roleLabel}
                          </span>
                        </span>
                        <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={10}
                      className="w-64 rounded-xl p-1.5"
                    >
                      <DropdownMenuLabel className="p-2.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} className="h-10 w-10" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-tight">
                              {user.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                              {user.email}
                            </p>
                            <span className="mt-1.5 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-hover">
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {accountLinks.map((item) => (
                        <DropdownMenuItem
                          key={item.href}
                          asChild
                          className="cursor-pointer rounded-lg py-2"
                        >
                          <Link href={item.href} className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />
                      <LogoutButton />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="hidden items-center gap-2 lg:flex">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">Get started</Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open main menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer: a sheet from the right, over everything. */}
      <div
        className={cn(
          // Visible at once on open (so the close button can take focus);
          // on close, visibility waits out the slide so it animates too.
          "fixed inset-0 z-[60] lg:hidden",
          isMobileMenuOpen
            ? "visible"
            : "invisible transition-[visibility] duration-300",
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={closeMenu}
          className={cn(
            "absolute inset-0 cursor-default bg-black/40 transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <Image
              src="/salon-logo.png"
              alt="SalonKhuji"
              width={1534}
              height={326}
              sizes="132px"
              className="h-7 w-auto"
            />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5">
            {accountLoading ? (
              <div
                aria-hidden="true"
                className="flex items-center gap-3 rounded-2xl p-3.5 ring-1 ring-border"
              >
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 rounded-2xl bg-primary-soft/60 p-3.5 ring-1 ring-border">
                <UserAvatar name={user.name} className="h-12 w-12 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Hi, {firstName(user.name)} 👋
                  </p>
                  <p className="truncate text-base font-bold leading-tight text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="shrink-0 self-start rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-hover">
                  {roleLabel}
                </span>
              </div>
            ) : (
              <div className="rounded-2xl bg-primary-soft/60 p-4 ring-1 ring-border">
                <p className="font-display text-lg font-bold text-foreground">
                  Welcome to SalonKhuji
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to book appointments and keep track of your visits.
                </p>
              </div>
            )}

            {user?.role === "CUSTOMER" && (
              <WalletMenu wallet={wallet} variant="card" onNavigate={closeMenu} />
            )}
            {/* Only the links inside close the drawer; revealing keeps it open. */}
            {user?.role === "SALON_OWNER" && (
              <BalanceReveal
                variant="card"
                label="Owner revenue"
                figures={[
                  { label: "Net earnings", amountMinor: ownerRevenueMinor ?? null },
                ]}
                footer={
                  <div className="border-t border-border p-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/earnings" onClick={closeMenu}>
                        View details
                      </Link>
                    </Button>
                  </div>
                }
              />
            )}
            {user?.role === "ADMIN" && (
              <BalanceReveal
                variant="card"
                label="Platform revenue"
                figures={[
                  { label: "Total", amountMinor: adminRevenueMinor ?? null },
                ]}
                footer={
                  <div className="border-t border-border p-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/dashboard" onClick={closeMenu}>
                        View details
                      </Link>
                    </Button>
                  </div>
                }
              />
            )}

            <div>
              <p className="mb-2 px-1 text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Your location
              </p>
              <LocationChip variant="block" onDone={closeMenu} />
            </div>

            <nav aria-label="Mobile navigation">
              <p className="mb-1 px-1 text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Explore
              </p>
              <ul className="space-y-0.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <DrawerLink
                      href={link.href}
                      icon={link.icon}
                      label={link.label}
                      active={isActive(link.href)}
                      onClick={closeMenu}
                    />
                  </li>
                ))}
                {/* Owners, staff and admins already have a salon side. */}
                {!accountLoading && (!user || user.role === "CUSTOMER") && (
                  <li>
                    <DrawerLink
                      href="/become-salon-owner"
                      icon={Store}
                      label="List your salon"
                      active={isActive("/become-salon-owner")}
                      onClick={closeMenu}
                    />
                  </li>
                )}
              </ul>
            </nav>

            {user && (
              <div>
                <p className="mb-1 px-1 text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Account
                </p>
                <ul className="space-y-0.5">
                  {accountLinks.map((item) => (
                    <li key={item.href}>
                      <DrawerLink
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={pathname === item.href}
                        onClick={closeMenu}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {accountLoading ? (
              <Skeleton aria-hidden="true" className="h-11 rounded-xl" />
            ) : user ? (
              <div className="rounded-xl border border-danger/20 bg-danger-soft">
                <LogoutButton />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login" onClick={closeMenu}>
                    <LogIn className="h-4 w-4" /> Sign in
                  </Link>
                </Button>
                <Button size="lg" asChild>
                  <Link href="/register" onClick={closeMenu}>
                    <UserPlus className="h-4 w-4" /> Get started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

const DrawerLink = ({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={cn(
      "group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      active ? "bg-primary-soft text-primary-hover" : "text-foreground hover:bg-muted",
    )}
  >
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground group-hover:bg-surface",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
    <span className="flex-1">{label}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
  </Link>
);

export default NavbarClient;
