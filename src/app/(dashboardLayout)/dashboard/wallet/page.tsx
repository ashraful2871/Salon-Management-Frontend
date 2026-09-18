"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2 } from "lucide-react";
import { getMyWallet, type Wallet as WalletType } from "@/services/wallet/getMyWallet";
import { getTransactions, type WalletTransaction } from "@/services/wallet/getTransactions";
import { checkTopupStatus } from "@/services/wallet/checkTopupStatus";
import { formatBDT } from "@/lib/money";
import TopUpModal from "@/components/Wallet/TopUpModal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
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
  };

  useEffect(() => {
    loadData();
  }, []);

  // IPN Polling Logic
  useEffect(() => {
    const topupStatus = searchParams.get("topup");
    const tranId = searchParams.get("tran");

    if (topupStatus === "processing" && tranId) {
      const poll = setInterval(async () => {
        const res = await checkTopupStatus(tranId);
        if (res.success && res.data) {
          if (res.data.status === "SUCCESS") {
            toast.success("Top-up successful!");
            clearInterval(poll);
            router.replace("/dashboard/wallet");
            loadData();
            // The header balance is server-rendered, so it only picks the
            // top-up up when the route re-renders.
            router.refresh();
          } else if (res.data.status === "FAILED" || res.data.status === "CANCELLED") {
            toast.error("Top-up failed or cancelled.");
            clearInterval(poll);
            router.replace("/dashboard/wallet");
          }
          // if PENDING, keep polling
        }
      }, 3000); // poll every 3 seconds

      // stop polling after 30 seconds
      setTimeout(() => clearInterval(poll), 30000);

      return () => clearInterval(poll);
    } else if (topupStatus === "failed") {
      toast.error("Top-up failed.");
      router.replace("/dashboard/wallet");
    } else if (topupStatus === "cancelled") {
      toast.error("Top-up cancelled.");
      router.replace("/dashboard/wallet");
    }
  }, [searchParams, router]);

  const isPolling = searchParams.get("topup") === "processing";

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" /> My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your balance and view transaction history
          </p>
        </div>
        <Button 
          onClick={() => setTopUpModalOpen(true)} 
          className="bg-sage hover:bg-sage/90 w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Money
        </Button>
      </div>

      {isPolling && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Processing your payment... Please wait.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-md bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
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
              <CardTitle>Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" onClick={loadData}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No transactions found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const holdDeltaMinor =
                      typeof tx.metadata?.holdDeltaMinor === "number"
                        ? tx.metadata.holdDeltaMinor
                        : null;
                    // A hold or release shifts money between available and held
                    // without changing the total, so its amountMinor is 0 and the
                    // hold delta is the only figure worth showing on the row.
                    const isHoldMove = tx.amountMinor === 0 && holdDeltaMinor !== null;
                    const displayMinor = isHoldMove
                      ? Math.abs(holdDeltaMinor)
                      : tx.amountMinor;
                    // Money coming back to the customer: a credit, or a released hold.
                    const isInflow = isHoldMove ? holdDeltaMinor < 0 : tx.amountMinor > 0;

                    return (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${isHoldMove ? "bg-amber-100 text-amber-600" : isInflow ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {isInflow ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{tx.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                              </span>
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {tx.type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isHoldMove ? "text-muted-foreground" : isInflow ? "text-green-600" : "text-foreground"}`}>
                            {!isHoldMove && isInflow ? "+" : ""}{formatBDT(displayMinor)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Bal: {formatBDT(tx.balanceAfterMinor)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
