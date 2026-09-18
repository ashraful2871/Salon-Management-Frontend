"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Menu,
  Scissors,
  User,
  Wallet as WalletIcon,
  X,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import type { Wallet } from "@/services/wallet/getMyWallet";
import LogoutButton from "./LogoutButton";
import WalletMenu from "./WalletMenu";

// Define the User Interface based on your token
interface UserData {
  role: string;
  email: string;
  name: string;
}

interface NavbarClientProps {
  user: UserData | null;
  /** Null when signed out, or when the wallet read failed. */
  wallet: Wallet | null;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/salons", label: "Salons" },
  { href: "/ai-suggestions", label: "AI Match" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  STAFF: "Staff",
  SALON_OWNER: "Salon Owner",
  ADMIN: "Admin",
  AGENT: "Agent",
};

const NavbarClient = ({ user, wallet }: NavbarClientProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Helper to get initials
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

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

  // While the drawer is open it owns the viewport: lock the page behind it and
  // let Escape close it.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";

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
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="SalonKhuji home"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-gold shadow-gold transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
                <Scissors className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </span>
              <span className="font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                Salon<span className="text-primary">Khuji</span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-slate-50/80 p-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
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
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {/* Balance: full pill on desktop, tap-through chip below it */}
                  <div className="hidden lg:block">
                    <WalletMenu wallet={wallet} />
                  </div>

                  <Link
                    href="/dashboard/wallet"
                    aria-label={`Wallet balance ${
                      wallet ? formatBDT(wallet.availableMinor) : "unavailable"
                    }`}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 pl-1.5 pr-2.5 lg:hidden"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-gold text-white">
                      <WalletIcon className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-black tabular-nums text-slate-900">
                      {wallet ? formatBDT(wallet.availableMinor) : "--"}
                    </span>
                  </Link>

                  {/* Account menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Account menu"
                        className="hidden h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-2.5 transition-all hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:flex"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src="" alt={user.name} />
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex max-w-[9rem] flex-col items-start leading-none">
                          <span className="w-full truncate text-sm font-semibold text-slate-900">
                            {user.name}
                          </span>
                          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            {roleLabel}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={10}
                      className="w-60"
                    >
                      <DropdownMenuLabel className="py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-none">
                              {user.name}
                            </p>
                            <p className="mt-1 truncate text-xs font-normal leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/dashboard" className="flex items-center">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                          href="/dashboard/wallet"
                          className="flex items-center"
                        >
                          <WalletIcon className="mr-2 h-4 w-4" />
                          <span>My Wallet</span>
                          {wallet && (
                            <span className="ml-auto text-xs font-bold tabular-nums text-slate-500">
                              {formatBDT(wallet.availableMinor)}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/my-profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>My Profile</span>
                        </Link>
                      </DropdownMenuItem>

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
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={
                  isMobileMenuOpen ? "Close main menu" : "Open main menu"
                }
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 lg:hidden",
          isMobileMenuOpen ? "visible" : "invisible",
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-slate-900/40 transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          id="mobile-menu"
          className={cn(
            "absolute inset-x-0 top-0 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-xl transition-all duration-300 ease-out",
            isMobileMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-4 opacity-0",
          )}
        >
          <div className="container mx-auto space-y-5 px-4 py-5 sm:px-6">
            {user && (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <WalletMenu
                  wallet={wallet}
                  variant="card"
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              </>
            )}

            <div className="space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/my-profile">
                      <User className="mr-2 h-4 w-4" /> My Profile
                    </Link>
                  </Button>
                  <LogoutButton />
                </>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavbarClient;
