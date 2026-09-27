"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, Lock, Plus, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import BalanceReveal from "@/components/Shared/BalanceReveal";
import TopUpModal from "@/components/Wallet/TopUpModal";
import { getMyWallet, type Wallet } from "@/services/wallet/getMyWallet";
import { cn } from "@/lib/utils";

/**
 * The customer's balance, masked until tapped. The server component seeds it
 * from `/wallet/me` on render; revealing re-reads it when the copy on screen is
 * over 30 s old, so a balance that moved elsewhere (a top-up, a booking hold)
 * corrects itself without a reload.
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

const STALE_AFTER_MS = 30_000;

const WalletMenu = ({
  wallet: initialWallet,
  variant = "compact",
  onNavigate,
}: WalletMenuProps) => {
  const [wallet, setWallet] = useState<Wallet | null>(initialWallet);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const lastFetchedAt = useRef(0);

  const refresh = () => {
    startRefresh(async () => {
      const result = await getMyWallet();
      if (result.success && result.data) {
        setWallet(result.data);
        lastFetchedAt.current = Date.now();
      }
    });
  };

  const refreshIfStale = () => {
    if (Date.now() - lastFetchedAt.current > STALE_AFTER_MS) refresh();
  };

  // Null while the wallet could not be read: each figure then reveals as "--".
  const figures = [
    { label: "Available", amountMinor: wallet?.availableMinor ?? null },
    { label: "On hold", amountMinor: wallet?.heldBalanceMinor ?? null },
    { label: "Total", amountMinor: wallet?.balanceMinor ?? null },
  ];

  if (variant === "compact") {
    return (
      <BalanceReveal
        variant="pill"
        label="Available balance"
        figures={figures}
        onReveal={refreshIfStale}
        refreshing={isRefreshing}
      />
    );
  }

  // The drawer closes first and the dialog opens on the next frame, so it
  // lands on top of the page instead of under the drawer.
  const openTopUp = () => {
    onNavigate?.();
    requestAnimationFrame(() => setTopUpOpen(true));
  };

  return (
    <>
      <BalanceReveal
        variant="card"
        label="Available balance"
        figures={figures}
        onReveal={refreshIfStale}
        refreshing={isRefreshing}
        action={
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh wallet balance"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <RefreshCcw
              className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
          </button>
        }
        footer={
          <>
            {wallet?.isFrozen && (
              <div className="flex items-start gap-2 border-b border-warning/30 bg-warning-soft px-4 py-2.5 text-[11px] leading-snug text-warning">
                <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>Your wallet is frozen. Contact support to restore it.</span>
              </div>
            )}

            <div className="flex items-center gap-2 p-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={openTopUp}
                disabled={wallet?.isFrozen}
              >
                <Plus className="h-4 w-4" /> Add money
              </Button>
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <Link href="/dashboard/wallet" onClick={onNavigate}>
                  History <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </>
        }
      />
      <TopUpModal open={topUpOpen} setOpen={setTopUpOpen} />
    </>
  );
};

export default WalletMenu;
