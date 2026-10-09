"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Lock, LockOpen, Search, SlidersHorizontal, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/Shared/PageHeader";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import Pagination from "@/components/Shared/Pagination";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { AdjustWalletDialog } from "@/components/Admin/finance/AdjustWalletDialog";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-types";
import { freezeWallet } from "@/services/admin/finance/freezeWallet";
import type { WalletDetail, WalletHit, WalletTransaction } from "@/services/admin/finance/types";

const FREEZE_CODES = [
  { value: "FRAUD", label: "Suspected fraud" },
  { value: "DISPUTE", label: "Payment dispute" },
  { value: "USER_REQUEST", label: "Customer asked" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "OTHER", label: "Other" },
];

const signed = (minor: number) =>
  minor > 0 ? `+${formatBDT(minor)}` : minor < 0 ? `−${formatBDT(-minor)}` : formatBDT(0);

const txColumns: Column<WalletTransaction>[] = [
  {
    key: "when",
    header: "When",
    mobile: "eyebrow",
    cell: (row) => <span className="text-sm text-muted-foreground">{formatDhaka(row.createdAt)}</span>,
  },
  {
    key: "what",
    header: "Description",
    mobile: "primary",
    cell: (row) => (
      <div className="min-w-0">
        <span className="block truncate">{row.description}</span>
        <span className="text-xs text-muted-foreground">{humanizeStatus(row.type)}</span>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    mobile: "trailing",
    cell: (row) => (
      <span className={cn("tabular-nums font-medium", row.amountMinor < 0 && "text-danger", row.amountMinor > 0 && "text-success")}>
        {signed(row.amountMinor)}
      </span>
    ),
  },
  {
    key: "after",
    header: "Balance after",
    align: "right",
    mobile: "meta",
    cell: (row) => <span className="tabular-nums text-muted-foreground">{formatBDT(row.balanceAfterMinor)}</span>,
  },
];

export function WalletsClient({
  q,
  userId,
  page,
  hits,
  detail,
  canAdjust,
  canFreeze,
}: {
  q: string;
  userId: string;
  page: number;
  hits: ApiResponse<WalletHit[]> | null;
  detail: ApiResponse<WalletDetail> | null;
  canAdjust: boolean;
  canFreeze: boolean;
}) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [term, setTerm] = useState(q);
  const [adjusting, setAdjusting] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const go = (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const wallet = detail?.success ? detail.data : undefined;
  const meta = detail?.meta;

  return (
    <div className="space-y-6">
      <PageHeader title="Wallets" description="Find a customer's wallet, see every movement, adjust or freeze it." />

      <form
        role="search"
        className="flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go(term.trim() ? { q: term.trim() } : {});
        }}
      >
        <label htmlFor="wallet-search" className="sr-only">
          Email, phone, name or user ID
        </label>
        <Input
          id="wallet-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Email, phone, name or user ID"
          autoComplete="off"
        />
        <Button type="submit" disabled={isPending}>
          <Search className="size-4" aria-hidden />
          Search
        </Button>
      </form>

      <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]", isPending && "opacity-70")}>
        {hits && (
          <section aria-label="Search results" className="min-w-0">
            {!hits.success ? (
              <ErrorState message={hits.message} />
            ) : (hits.data ?? []).length === 0 ? (
              <EmptyState icon={WalletCards} title="No one matches" description="Try the full email or phone number." />
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {(hits.data ?? []).map((hit) => (
                  <li key={hit.userId}>
                    <Link
                      href={`${pathname}?${new URLSearchParams({ q, user: hit.userId })}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go({ q, user: hit.userId });
                      }}
                      aria-current={hit.userId === userId ? "true" : undefined}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        hit.userId === userId && "bg-primary-soft",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{hit.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {hit.email ?? hit.phone ?? hit.userId} · {humanizeStatus(hit.role)}
                          {hit.isTest ? " · test" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm tabular-nums">
                        {formatBDT(hit.wallet.balanceMinor)}
                        {hit.wallet.isFrozen && <Lock className="ml-1 inline size-3.5 text-danger" aria-label="Frozen" />}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {detail && (
          <section aria-label="Wallet" className={cn("min-w-0 space-y-4", !hits && "lg:col-span-2")}>
            {!detail.success || !wallet ? (
              <ErrorState message={detail.message} />
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-lg font-semibold">{wallet.user.name}</h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {wallet.user.email ?? "—"}
                        {wallet.user.phone ? ` · ${wallet.user.phone}` : ""}
                      </p>
                      <Link href={`/dashboard/admin/users/${wallet.user.id}`} className="text-sm text-primary hover:underline">
                        Open user
                      </Link>
                    </div>
                    {wallet.wallet.isFrozen ? (
                      <ToneBadge status="FROZEN" tone="danger" dot>
                        Frozen
                      </ToneBadge>
                    ) : (
                      <ToneBadge status="ACTIVE" tone="success" dot>
                        Active
                      </ToneBadge>
                    )}
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    {[
                      ["Balance", wallet.wallet.balanceMinor],
                      ["Available", wallet.wallet.availableMinor],
                      ["Held", wallet.wallet.heldMinor],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-heading text-base font-semibold tabular-nums">{formatBDT(value as number)}</dd>
                      </div>
                    ))}
                  </dl>
                  {wallet.self ? (
                    <p className="mt-4 text-sm text-muted-foreground">This is your own wallet: another admin has to change it.</p>
                  ) : (
                    (canAdjust || canFreeze) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canAdjust && (
                          <Button size="sm" onClick={() => setAdjusting(true)}>
                            <SlidersHorizontal className="size-4" aria-hidden />
                            Adjust
                          </Button>
                        )}
                        {canFreeze && (
                          <Button size="sm" variant="secondary" onClick={() => setFreezing(true)}>
                            {wallet.wallet.isFrozen ? <LockOpen className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                            {wallet.wallet.isFrozen ? "Unfreeze" : "Freeze"}
                          </Button>
                        )}
                      </div>
                    )
                  )}
                </div>

                <DataList
                  items={wallet.transactions}
                  rowKey={(row) => row.id}
                  columns={txColumns}
                  caption="Wallet transactions"
                  density="compact"
                  empty={<EmptyState icon={WalletCards} title="No transactions yet" />}
                />
                {meta && (
                  <Pagination
                    page={page}
                    totalPages={Math.max(1, Math.ceil(meta.total / meta.limit))}
                    total={meta.total}
                    pageSize={meta.limit}
                    itemLabel="transactions"
                    disabled={isPending}
                    onPageChange={(next) => go({ ...(q ? { q } : {}), user: userId, page: String(next) })}
                  />
                )}

                {adjusting && (
                <AdjustWalletDialog
                  open={adjusting}
                  onOpenChange={setAdjusting}
                  userId={wallet.user.id}
                  name={wallet.user.name}
                  balanceMinor={wallet.wallet.balanceMinor}
                />
                )}
                <ReasonDialog
                  open={freezing}
                  onOpenChange={setFreezing}
                  title={wallet.wallet.isFrozen ? "Unfreeze wallet" : "Freeze wallet"}
                  description={
                    wallet.wallet.isFrozen
                      ? "Bookings and top-up spends work again."
                      : "No deposits, spends or refunds until it is unfrozen. Admin adjustments still work."
                  }
                  reasonCodes={FREEZE_CODES}
                  confirmLabel={wallet.wallet.isFrozen ? "Unfreeze" : "Freeze"}
                  tone={wallet.wallet.isFrozen ? "default" : "danger"}
                  showNotify={false}
                  stepUp
                  onConfirm={({ reasonCode, note }) => {
                    const label = FREEZE_CODES.find((c) => c.value === reasonCode)?.label ?? reasonCode;
                    return freezeWallet(wallet.user.id, !wallet.wallet.isFrozen, note ? `${label}: ${note}` : label);
                  }}
                  onDone={(result) => toast.success(result.message)}
                />
              </>
            )}
          </section>
        )}

        {!hits && !detail && (
          <div className="lg:col-span-2">
            <EmptyState icon={Search} title="Search for a wallet" description="Every customer has one; it opens on the first top-up or booking." />
          </div>
        )}
      </div>
    </div>
  );
}
