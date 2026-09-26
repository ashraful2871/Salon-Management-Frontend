"use client";

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
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import type { Wallet } from "@/services/wallet/getMyWallet";
import LogoutButton from "./LogoutButton";
import WalletMenu from "./WalletMenu";
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
    <AvatarFallback className="bg-gradient-gold text-xs font-bold text-white">
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);

const TapToRevealPill = ({
  label,
  amountMinor,
}: {
  label: string;
  amountMinor: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isOpen) {
          setIsOpen(true);
          setTimeout(() => setIsOpen(false), 3500);
        }
      }}
      aria-label={`${label} balance`}
      className={cn(
        "group relative flex h-10 w-28 sm:w-36 cursor-pointer items-center overflow-hidden rounded-full border bg-white p-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isOpen
          ? "border-primary/40 shadow-sm ring-1 ring-primary/10"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
      )}
    >
      <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-gold text-white shadow-gold transition-transform duration-300 group-hover:scale-105">
        <WalletIcon className="h-4 w-4" />
      </div>

      <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-out",
            isOpen
              ? "-translate-y-full opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wide text-slate-500 whitespace-nowrap">
            Tap for {label}
          </span>
        </div>

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-500 ease-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          )}
        >
          <span className="text-xs sm:text-sm font-black tabular-nums text-slate-900">
            {formatBDT(amountMinor)}
          </span>
        </div>
      </div>
    </button>
  );
};

const TapToRevealCard = ({
  label,
  amountMinor,
  link,
}: {
  label: string;
  amountMinor: number;
  link?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="group relative cursor-pointer bg-gradient-gold px-4 py-4 text-white transition-all hover:brightness-110"
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => setIsOpen(false), 3500);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/85">
            <WalletIcon className="h-3.5 w-3.5" /> {label}
          </span>
        </div>

        <div className="relative mt-2 h-10 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 flex items-center transition-all duration-500 ease-out",
              isOpen
                ? "-translate-y-full opacity-0"
                : "translate-y-0 opacity-100",
            )}
          >
            <span className="text-lg font-bold tracking-wide text-white/95">
              Tap for Balance
            </span>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center gap-2 transition-all duration-500 ease-out",
              isOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0",
            )}
          >
            <p className="text-3xl font-black tabular-nums tracking-tight">
              {formatBDT(amountMinor)}
            </p>
          </div>
        </div>
      </div>
      {link && (
        <div className="flex items-center gap-2 p-3">
          <Button size="sm" variant="outline" className="h-9 w-full" asChild>
            <Link href={link}>View Details</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

const NavbarClient = ({
  user,
  wallet,
  ownerRevenueMinor,
  adminRevenueMinor,
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
  const accountLinks: { href: string; label: string; icon: LucideIcon; trailing?: string }[] =
    user
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          ...(user.role === "CUSTOMER"
            ? [
                {
                  href: "/dashboard/wallet",
                  label: "My Wallet",
                  icon: WalletIcon,
                  trailing: wallet ? formatBDT(wallet.availableMinor) : undefined,
                },
              ]
            : []),
          ...(user.role === "SALON_OWNER"
            ? [
                {
                  href: "/dashboard/earnings",
                  label: "Earnings",
                  icon: WalletIcon,
                  trailing: formatBDT(ownerRevenueMinor ?? 0),
                },
              ]
            : []),
          { href: "/my-profile", label: "My Profile", icon: User },
        ]
      : [];

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
          isScrolled
            ? "border-slate-200/80 bg-white/90 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl"
            : "border-transparent bg-white/70 backdrop-blur-md",
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/salon-logo.png"
                alt="SalonKhuji Logo"
                className="h-7 w-auto max-w-[140px] object-contain transition-transform group-hover:scale-105 min-[400px]:h-8 min-[400px]:max-w-none sm:h-9 xl:h-10"
              />
            </Link>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-slate-50/80 p-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 xl:px-4",
                    isActive(link.href)
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
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

              {user ? (
                <>
                  {/* Balance: from md up; smaller screens have it in the drawer. */}
                  <div className="hidden md:block">
                    {user.role === "CUSTOMER" && <WalletMenu wallet={wallet} />}
                    {user.role === "SALON_OWNER" && (
                      <TapToRevealPill
                        label="Revenue"
                        amountMinor={ownerRevenueMinor ?? 0}
                      />
                    )}
                    {user.role === "ADMIN" && (
                      <TapToRevealPill
                        label="Revenue"
                        amountMinor={adminRevenueMinor ?? 0}
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
                        className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white p-1 transition-all hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:border-primary/40 data-[state=open]:ring-1 data-[state=open]:ring-primary/10 lg:pr-3"
                      >
                        <UserAvatar name={user.name} />
                        <span className="hidden max-w-[6rem] flex-col items-start leading-none lg:flex xl:max-w-[9rem]">
                          <span className="w-full truncate text-sm font-semibold text-slate-900">
                            <span className="xl:hidden">{firstName(user.name)}</span>
                            <span className="hidden xl:inline">{user.name}</span>
                          </span>
                          <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-wider text-slate-500 xl:block">
                            {roleLabel}
                          </span>
                        </span>
                        <ChevronDown className="hidden h-4 w-4 shrink-0 text-slate-400 lg:block" />
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
                            <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
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
                            {item.trailing && (
                              <span className="ml-auto text-xs font-bold tabular-nums text-slate-500">
                                {item.trailing}
                              </span>
                            )}
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
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button variant="gold" size="sm" asChild>
                    <Link href="/register">Register</Link>
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
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
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
          "fixed inset-0 z-[60] lg:hidden",
          isMobileMenuOpen ? "visible" : "invisible",
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={closeMenu}
          className={cn(
            "absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/salon-logo.png" alt="SalonKhuji" className="h-7 w-auto" />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5">
            {user ? (
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-cream to-white p-3.5 ring-1 ring-gold/20">
                <UserAvatar name={user.name} className="h-12 w-12 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">
                    Hi, {firstName(user.name)} 👋
                  </p>
                  <p className="truncate text-base font-bold leading-tight text-slate-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="shrink-0 self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {roleLabel}
                </span>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-cream to-white p-4 ring-1 ring-gold/20">
                <p className="font-display text-lg font-bold text-slate-900">
                  Welcome to SalonKhuji
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Sign in to book appointments and keep track of your visits.
                </p>
              </div>
            )}

            {user?.role === "CUSTOMER" && (
              <WalletMenu wallet={wallet} variant="card" onNavigate={closeMenu} />
            )}
            {user?.role === "SALON_OWNER" && (
              <div onClick={closeMenu}>
                <TapToRevealCard
                  label="Owner Revenue"
                  amountMinor={ownerRevenueMinor ?? 0}
                  link="/dashboard/earnings"
                />
              </div>
            )}
            {user?.role === "ADMIN" && (
              <div onClick={closeMenu}>
                <TapToRevealCard
                  label="Platform Revenue"
                  amountMinor={adminRevenueMinor ?? 0}
                  link="/dashboard"
                />
              </div>
            )}

            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Your location
              </p>
              <LocationChip variant="block" onDone={closeMenu} />
            </div>

            <nav aria-label="Mobile navigation">
              <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
              </ul>
            </nav>

            {user && (
              <div>
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Account
                </p>
                <ul className="space-y-0.5">
                  {accountLinks.map((item) => (
                    <li key={item.href}>
                      <DrawerLink
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        trailing={item.trailing}
                        active={pathname === item.href}
                        onClick={closeMenu}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {user ? (
              <div className="rounded-xl border border-red-100 bg-red-50/50">
                <LogoutButton />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11 rounded-xl border" asChild>
                  <Link href="/login" onClick={closeMenu}>
                    <LogIn className="h-4 w-4" /> Sign in
                  </Link>
                </Button>
                <Button variant="gold" className="h-11 rounded-xl" asChild>
                  <Link href="/register" onClick={closeMenu}>
                    <UserPlus className="h-4 w-4" /> Register
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
  trailing,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  trailing?: string;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={cn(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      active ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-100",
    )}
  >
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
        active ? "bg-primary text-white" : "bg-slate-100 text-slate-600 group-hover:bg-white",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
    <span className="flex-1">{label}</span>
    {trailing && (
      <span className="text-xs font-bold tabular-nums text-slate-500">{trailing}</span>
    )}
    <ChevronRight className="h-4 w-4 text-slate-300" />
  </Link>
);

export default NavbarClient;
