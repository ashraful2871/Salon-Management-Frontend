import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import WalletBalanceCard from "@/components/Wallet/WalletBalanceCard";
import WalletTransactions from "@/components/Wallet/WalletTransactions";
import WalletPagination from "@/components/Wallet/WalletPagination";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getMyWallet } from "@/services/wallet/getMyWallet";
import { getTransactions } from "@/services/wallet/getTransactions";
import type { ProviderId } from "@/lib/payment-providers";

export const metadata = {
  title: "My wallet",
};

const PAGE_SIZE = 20;

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Rendered on the server: the balance and the first page of transactions are
 * in the HTML, read in parallel. Only the balance card (refresh, top-up) and
 * the pager are client islands.
 */
export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // A gateway return now has its own page. This only catches links from
  // before that change, and a payment that was in flight across a deploy.
  const topup = one(params.topup);
  if (topup) {
    const outcome =
      topup === "processing"
        ? "success"
        : topup === "cancelled"
          ? "cancelled"
          : "failed";
    const tran = one(params.tran);
    redirect(
      `/dashboard/wallet/payment/${outcome}${
        tran ? `?tran=${encodeURIComponent(tran)}` : ""
      }`,
    );
  }

  const page = Math.max(1, Math.floor(Number(one(params.page))) || 1);
  const methodParam = one(params.method);
  const initialMethod: ProviderId | undefined =
    methodParam === "BKASH" || methodParam === "SSLCOMMERZ"
      ? methodParam
      : undefined;

  const [walletRes, txRes] = await Promise.all([
    getMyWallet(),
    getTransactions(page, PAGE_SIZE),
  ]);

  const wallet = walletRes.success ? (walletRes.data ?? null) : null;
  const transactions = txRes.success ? (txRes.data ?? []) : [];
  const total = txRes.meta?.total ?? transactions.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My wallet"
        description="Your balance, and every movement in and out of it."
      />

      {!walletRes.success && (
        <Alert className="border-danger/30 bg-danger-soft">
          <AlertTitle>We couldn&apos;t read your balance</AlertTitle>
          <AlertDescription>{walletRes.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start">
        <div className="xl:sticky xl:top-20">
          <WalletBalanceCard
            wallet={wallet}
            openTopUp={one(params.add) === "1"}
            initialMethod={initialMethod}
          />
        </div>

        <section aria-labelledby="wallet-history" className="min-w-0 space-y-4">
          <div>
            <h2 id="wallet-history" className="font-display text-lg font-semibold">
              Transactions
            </h2>
            <p className="text-sm text-muted-foreground">Newest first.</p>
          </div>

          <FilterNavigationProvider>
            <PendingRegion>
              {!txRes.success ? (
                <Alert className="border-danger/30 bg-danger-soft">
                  <AlertTitle>We couldn&apos;t load your transactions</AlertTitle>
                  <AlertDescription>{txRes.message}</AlertDescription>
                </Alert>
              ) : transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface">
                  <EmptyState
                    title={page > 1 ? "Nothing on this page" : "No transactions yet"}
                    description={
                      page > 1
                        ? "Your history is shorter than this."
                        : "Top up your wallet and it will show up here."
                    }
                    action={
                      page > 1 ? (
                        <Button asChild variant="outline">
                          <Link href="/dashboard/wallet">Back to the newest</Link>
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <WalletTransactions transactions={transactions} />
              )}
            </PendingRegion>

            <WalletPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
            />
          </FilterNavigationProvider>
        </section>
      </div>
    </div>
  );
}
