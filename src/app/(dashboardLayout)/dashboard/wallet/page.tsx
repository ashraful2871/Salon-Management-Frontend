"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import {
  getMyWallet,
  type Wallet as WalletType,
} from "@/services/wallet/getMyWallet";
import {
  getTransactions,
  type WalletTransaction,
} from "@/services/wallet/getTransactions";
import { formatBDT } from "@/lib/money";
import TopUpModal from "@/components/Wallet/TopUpModal";
import CopyButton from "@/components/Wallet/CopyButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TransactionRow = ({ tx }: { tx: WalletTransaction }) => {
  const holdDeltaMinor =
    typeof tx.metadata?.holdDeltaMinor === "number"
      ? tx.metadata.holdDeltaMinor
      : null;
  // A hold or release shifts money between available and held without changing
  // the total, so its amountMinor is 0 and the hold delta is the only figure
  // worth showing on the row.
  const isHoldMove = tx.amountMinor === 0 && holdDeltaMinor !== null;
  const displayMinor = isHoldMove ? Math.abs(holdDeltaMinor) : tx.amountMinor;
  // Money coming back to the customer: a credit, or a released hold.
  const isInflow = isHoldMove ? holdDeltaMinor < 0 : tx.amountMinor > 0;

  // Gateway top-ups carry the id the customer also has on their receipt email
  // and on the payment result page. It is the only handle support can trace.
  // Rows written before that metadata existed still have it inside their
  // idempotency key (`topup:TOPUP-...`), so no history is left without an id.
  const gatewayTxnId =
    typeof tx.metadata?.transactionId === "string"
      ? tx.metadata.transactionId
      : tx.idempotencyKey?.startsWith("topup:")
        ? tx.idempotencyKey.slice("topup:".length)
        : null;
  const gatewayRef =
    typeof tx.metadata?.gatewayRef === "string" ? tx.metadata.gatewayRef : null;

  return (
    <div className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isHoldMove
              ? "bg-amber-100 text-amber-600"
              : isInflow
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
          )}
        >
          {isInflow ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0">
          <p className="font-medium text-foreground">{tx.description}</p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase">
              {tx.type.replace(/_/g, " ")}
            </Badge>
          </div>

          {gatewayTxnId && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Txn ID
              </span>
              <span
                className="max-w-[240px] truncate font-mono text-xs text-foreground/80 sm:max-w-none"
                title={gatewayTxnId}
              >
                {gatewayTxnId}
              </span>
              <CopyButton
                value={gatewayTxnId}
                label="Transaction ID"
                className="h-6 w-6"
              />
              {gatewayRef && (
                <span className="text-[11px] text-muted-foreground">
                  · Ref {gatewayRef}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 pl-12 text-left sm:pl-0 sm:text-right">
        <p
          className={cn(
            "font-bold tabular-nums",
            isHoldMove
              ? "text-muted-foreground"
              : isInflow
                ? "text-green-600"
                : "text-foreground"
          )}
        >
          {!isHoldMove && isInflow ? "+" : ""}
          {formatBDT(displayMinor)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          Bal: {formatBDT(tx.balanceAfterMinor)}
        </p>
      </div>
    </div>
  );
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  // "Try again" on a failed payment comes back here with ?add=1 and expects the
  // top-up dialog already open.
  const [topUpModalOpen, setTopUpModalOpen] = useState(
    () => searchParams.get("add") === "1"
  );

  const loadData = useCallback(async () => {
    const [walletRes, txRes] = await Promise.all([
      getMyWallet(),
      getTransactions(1, 50),
    ]);
    if (walletRes.success && walletRes.data) {
      setWallet(walletRes.data);
    }
    if (txRes.success && txRes.data) {
      setTransactions(txRes.data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  // A gateway return now has its own page. This only catches links from before
  // that change - and a payment that was in flight across a deploy.
  useEffect(() => {
    const topup = searchParams.get("topup");
    if (!topup) return;

    const outcome =
      topup === "processing"
        ? "success"
        : topup === "cancelled"
          ? "cancelled"
          : "failed";
    const tran = searchParams.get("tran");

    router.replace(
      `/dashboard/wallet/payment/${outcome}${
        tran ? `?tran=${encodeURIComponent(tran)}` : ""
      }`
    );
  }, [searchParams, router]);

  // Drop the flag once it has done its job, so a refresh does not reopen the
  // dialog on someone who just closed it.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      router.replace("/dashboard/wallet");
    }
  }, [searchParams, router]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold">
            <Wallet className="h-8 w-8 text-primary" /> My Wallet
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your balance and view transaction history
          </p>
        </div>
        <Button
          onClick={() => setTopUpModalOpen(true)}
          className="w-full bg-sage hover:bg-sage/90 md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Money
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-foreground">
                  {formatBDT(wallet?.availableMinor || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Held Balance (Deposits)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-muted-foreground">
                  {formatBDT(wallet?.heldBalanceMinor || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatBDT(wallet?.balanceMinor || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every movement in and out of your wallet, newest first
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCcw
                  className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="px-0 sm:px-2">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>No transactions yet.</p>
                  <p className="mt-1 text-sm">
                    Add money to your wallet and it will show up here.
                  </p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <TopUpModal open={topUpModalOpen} setOpen={setTopUpModalOpen} />
    </div>
  );
}
