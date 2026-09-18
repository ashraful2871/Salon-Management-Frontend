"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Loader2,
  Lock,
  Plus,
  RefreshCcw,
  Wallet as WalletIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import TopUpModal from "@/components/Wallet/TopUpModal";
import { getMyWallet, type Wallet } from "@/services/wallet/getMyWallet";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The balance shown in the header. The server component seeds it from
 * `/wallet/me` on render; opening the menu re-reads it, so a balance that moved
 * elsewhere (a top-up, a booking hold) corrects itself without a reload.
 *
 * Amounts come off the `Minor` fields — `formatBDT` divides by 100 itself, so
 * formatting the taka twins would render them 100x too small.
 */
interface WalletMenuProps {
  wallet: Wallet | null;
  /** `compact` is the header pill; `card` is the block inside the mobile menu. */
  variant?: "compact" | "card";
  /** Mobile only: lets the drawer close itself when a link inside is followed. */
  onNavigate?: () => void;
}

const WalletMenu = ({
  wallet: initialWallet,
  variant = "compact",
  onNavigate,
}: WalletMenuProps) => {
  const [wallet, setWallet] = useState<Wallet | null>(initialWallet);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const refresh = () => {
    startRefresh(async () => {
      const result = await getMyWallet();
      if (result.success && result.data) {
        setWallet(result.data);
      }
    });
  };

  const availableMinor = wallet?.availableMinor ?? 0;
  const heldMinor = wallet?.heldBalanceMinor ?? 0;
  const totalMinor = wallet?.balanceMinor ?? 0;
  const isUnavailable = wallet === null;

  const openTopUp = () => {
    setMenuOpen(false);
    setTopUpOpen(true);
  };

  // Shared by both variants: the secondary figures, the frozen notice, actions.
  const details = (
    <>
      <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
        <div className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            On hold
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-800">
            {formatBDT(heldMinor)}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Total
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-800">
            {formatBDT(totalMinor)}
          </p>
        </div>
      </div>

      {wallet?.isFrozen && (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] leading-snug text-amber-800">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>Your wallet is frozen. Contact support to restore it.</span>
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <Button
          size="sm"
          className="h-9 flex-1 bg-sage text-white hover:bg-sage/90"
          onClick={openTopUp}
          disabled={wallet?.isFrozen}
        >
          <Plus className="h-4 w-4" /> Add money
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 flex-1"
          asChild
          onClick={onNavigate}
        >
          <Link href="/dashboard/wallet">
            History <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </>
  );

  if (variant === "card") {
    return (
      <>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-gold px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/85">
                <WalletIcon className="h-3.5 w-3.5" /> Available balance
              </span>
              <button
                type="button"
                onClick={refresh}
                aria-label="Refresh wallet balance"
                className="rounded-full p-1 text-white/85 transition-colors hover:bg-white/20 hover:text-white"
              >
                <RefreshCcw
                  className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
                />
              </button>
            </div>
            <p className="mt-1 text-3xl font-black tabular-nums tracking-tight">
              {isUnavailable ? "--" : formatBDT(availableMinor)}
            </p>
          </div>
          {details}
        </div>
        <TopUpModal open={topUpOpen} setOpen={setTopUpOpen} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu
        // Not modal, so opening the top-up dialog from inside the menu does not
        // leave Radix's pointer-events lock behind on the body.
        modal={false}
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (open) refresh();
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Wallet balance"
            className="group flex h-10 cursor-pointer items-center gap-2 rounded-full border border-primary/25 bg-primary/5 pl-1.5 pr-2.5 transition-all hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-gold text-white shadow-gold">
              <WalletIcon className="h-3.5 w-3.5" />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                Balance
              </span>
              <span className="mt-0.5 text-sm font-black tabular-nums text-slate-900">
                {isUnavailable ? "--" : formatBDT(availableMinor)}
              </span>
            </span>
            {isRefreshing && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-72 overflow-hidden p-0"
        >
          <div className="bg-gradient-gold px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/85">
                Available balance
              </span>
              <button
                type="button"
                onClick={refresh}
                aria-label="Refresh wallet balance"
                className="rounded-full p-1 text-white/85 transition-colors hover:bg-white/20 hover:text-white"
              >
                <RefreshCcw
                  className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
                />
              </button>
            </div>
            <p className="mt-1 text-3xl font-black tabular-nums tracking-tight">
              {isUnavailable ? "--" : formatBDT(availableMinor)}
            </p>
            <p className="mt-1 text-[11px] text-white/80">
              {isUnavailable
                ? "Balance unavailable right now."
                : "Spendable on bookings and deposits."}
            </p>
          </div>
          {details}
        </DropdownMenuContent>
      </DropdownMenu>

      <TopUpModal open={topUpOpen} setOpen={setTopUpOpen} />
    </>
  );
};

export default WalletMenu;
