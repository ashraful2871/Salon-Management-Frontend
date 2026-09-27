"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Plus, RefreshCcw } from "lucide-react";

import BalanceReveal from "@/components/Shared/BalanceReveal";
import { Button } from "@/components/ui/button";
import TopUpModal from "@/components/Wallet/TopUpModal";
import type { Wallet } from "@/services/wallet/getMyWallet";
import type { ProviderId } from "@/lib/payment-providers";
import { cn } from "@/lib/utils";

/**
 * The wallet page's one interactive corner: the balance (rendered on the
 * server, shown from the first paint), Refresh and the top-up dialog.
 */
export default function WalletBalanceCard({
  wallet,
  openTopUp = false,
  initialMethod,
}: {
  /** Null when the wallet could not be read: each figure shows "--". */
  wallet: Wallet | null;
  /** `?add=1`: "Try again" on a failed payment expects the dialog open. */
  openTopUp?: boolean;
  /** `?method=`: "Try another method" opens on the other gateway. */
  initialMethod?: ProviderId;
}) {
  const router = useRouter();
  const [topUpOpen, setTopUpOpen] = useState(openTopUp);
  const [refreshing, startRefresh] = useTransition();

  // Drop the flag once it has done its job, so reloading the page does not
  // reopen the dialog on someone who just closed it. No server round trip.
  useEffect(() => {
    if (openTopUp) window.history.replaceState(null, "", "/dashboard/wallet");
  }, [openTopUp]);

  // The wallet is read uncached, so a refresh is the way to see a top-up or a
  // booking hold that landed after the page was rendered. Not a mutation.
  const refresh = () => startRefresh(() => router.refresh());

  return (
    <>
      <BalanceReveal
        variant="card"
        label="Available balance"
        defaultRevealed
        refreshing={refreshing}
        figures={[
          { label: "Available", amountMinor: wallet?.availableMinor ?? null },
          { label: "On hold", amountMinor: wallet?.heldBalanceMinor ?? null },
          { label: "Total", amountMinor: wallet?.balanceMinor ?? null },
        ]}
        action={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh wallet"
            title="Refresh"
            className="size-8 text-muted-foreground"
          >
            <RefreshCcw className={cn(refreshing && "animate-spin")} />
          </Button>
        }
        footer={
          <>
            {wallet?.isFrozen && (
              <p className="flex items-start gap-2 border-b border-warning/30 bg-warning-soft px-4 py-2.5 text-xs leading-snug text-warning">
                <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                Your wallet is frozen. Contact support to restore it.
              </p>
            )}
            <div className="p-3">
              <Button
                className="w-full"
                onClick={() => setTopUpOpen(true)}
                disabled={wallet?.isFrozen}
              >
                <Plus />
                Top up
              </Button>
            </div>
          </>
        }
      />
      <p className="mt-2 px-1 text-xs text-muted-foreground">
        Held money is a booking deposit. It is used or returned when the
        booking ends.
      </p>

      <TopUpModal
        open={topUpOpen}
        setOpen={setTopUpOpen}
        initialMethod={initialMethod}
      />
    </>
  );
}
