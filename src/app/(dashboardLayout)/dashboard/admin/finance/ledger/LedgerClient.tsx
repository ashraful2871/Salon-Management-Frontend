"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { BookOpenCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/Shared/PageHeader";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ExportButton } from "@/components/Admin/finance/ExportButton";
import { RANGE_PRESETS, type RangePreset } from "@/components/Admin/finance/range";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-types";
import { getLedger } from "@/services/admin/finance/getLedger";
import {
  LEDGER_ACCOUNTS,
  type LedgerEntry,
  type LedgerPage,
  type Reconciliation,
} from "@/services/admin/finance/types";

type Filters = {
  account: string;
  salonId: string;
  appointmentId: string;
  payoutId: string;
  range: RangePreset;
};

const signed = (minor: number) =>
  minor > 0 ? `+${formatBDT(minor)}` : minor < 0 ? `−${formatBDT(-minor)}` : formatBDT(0);

const columns: Column<LedgerEntry>[] = [
  {
    key: "when",
    header: "When",
    mobile: "eyebrow",
    cell: (row) => <span className="text-sm text-muted-foreground">{formatDhaka(row.createdAt)}</span>,
  },
  {
    key: "account",
    header: "Account",
    mobile: "meta",
    cell: (row) => <span className="text-sm">{humanizeStatus(row.account)}</span>,
  },
  {
    key: "description",
    header: "Description",
    mobile: "primary",
    cell: (row) => (
      <div className="min-w-0 text-sm">
        <span className="block truncate">{row.description}</span>
        <span className="text-xs text-muted-foreground">
          {row.salon?.name}
          {row.appointment && (
            <>
              {" · "}
              <Link href={`/dashboard/admin/bookings/${row.appointment.id}`} className="text-primary hover:underline">
                {row.appointment.token ?? "booking"}
              </Link>
            </>
          )}
          {row.payoutId && ` · payout ${row.payoutId.slice(0, 8)}`}
        </span>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    mobile: "trailing",
    cell: (row) => (
      <span className={cn("font-medium tabular-nums", row.amountMinor < 0 && "text-danger")}>
        {signed(row.amountMinor)}
      </span>
    ),
  },
];

export function LedgerClient({
  filters,
  from,
  to,
  ledger,
  reconciliation,
  canExport,
}: {
  filters: Filters;
  from?: string;
  to?: string;
  ledger: ApiResponse<LedgerPage>;
  reconciliation: ApiResponse<Reconciliation>;
  canExport: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState<LedgerEntry[]>(ledger.data?.items ?? []);
  const [cursor, setCursor] = useState<string | null>(ledger.data?.nextCursor ?? null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [loadingMore, startLoading] = useTransition();
  const [salon, setSalon] = useState(filters.salonId);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      setMoreError(null);
      const result = await getLedger({
        account: filters.account || undefined,
        salonId: filters.salonId || undefined,
        appointmentId: filters.appointmentId || undefined,
        payoutId: filters.payoutId || undefined,
        from,
        to,
        cursor,
      });
      if (!result.success || !result.data) {
        setMoreError(result.message);
        return;
      }
      setItems((current) => [...current, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted",
    );

  const recon = reconciliation.success ? reconciliation.data : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger"
        description="Every ledger entry, the bookings whose entries do not sum to zero, and wallets out of step."
        actions={canExport ? <ExportButton kind="ledger" from={from} to={to} /> : undefined}
      />

      <div className={cn("space-y-3", isPending && "opacity-70")} aria-busy={isPending}>
        <div role="group" aria-label="Account" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <button type="button" className={chip(!filters.account)} aria-pressed={!filters.account} onClick={() => set({ account: null })}>
            All accounts
          </button>
          {LEDGER_ACCOUNTS.map((account) => (
            <button
              key={account}
              type="button"
              className={chip(filters.account === account)}
              aria-pressed={filters.account === account}
              onClick={() => set({ account })}
            >
              {humanizeStatus(account)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={chip(filters.range === preset.value)}
                aria-pressed={filters.range === preset.value}
                onClick={() => set({ range: preset.value })}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              set({ salonId: salon.trim() || null });
            }}
          >
            <label htmlFor="ledger-salon" className="sr-only">
              Salon ID
            </label>
            <Input
              id="ledger-salon"
              value={salon}
              onChange={(e) => setSalon(e.target.value)}
              placeholder="Salon ID"
              className="h-9 w-56"
            />
            <Button type="submit" size="sm" variant="secondary">
              Filter
            </Button>
          </form>
          {(filters.appointmentId || filters.payoutId) && (
            <Button size="sm" variant="ghost" onClick={() => set({ appointmentId: null, payoutId: null })}>
              Clear booking/payout filter
            </Button>
          )}
        </div>
      </div>

      {!ledger.success ? (
        <ErrorState message={ledger.message} />
      ) : (
        <div className="space-y-3">
          <DataList
            items={items}
            rowKey={(row) => row.id}
            columns={columns}
            caption="Ledger entries"
            density="compact"
            empty={<EmptyState icon={BookOpenCheck} title="No entries match" />}
          />
          {moreError && (
            <p role="alert" className="text-sm text-danger">
              {moreError}
            </p>
          )}
          {cursor && (
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section id="unbalanced" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="font-heading text-base font-semibold">Unbalanced bookings</h2>
          <p className="text-sm text-muted-foreground">Every booking&rsquo;s entries must sum to zero.</p>
          {!reconciliation.success ? (
            <ErrorState message={reconciliation.message} />
          ) : recon && recon.unbalanced.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden /> All bookings balance.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recon?.unbalanced.map((row) => (
                <li key={row.appointmentId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/dashboard/admin/bookings/${row.appointmentId}`} className="min-w-0 truncate text-primary hover:underline">
                    {row.token ?? row.appointmentId.slice(0, 8)}
                    {row.salonName && <span className="text-muted-foreground"> · {row.salonName}</span>}
                  </Link>
                  <ToneBadge status="FAILED" tone="danger">
                    off by {signed(row.totalMinor)}
                  </ToneBadge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="drift" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="font-heading text-base font-semibold">Wallet drift</h2>
          <p className="text-sm text-muted-foreground">A wallet&rsquo;s balance must equal the sum of its transactions.</p>
          {!reconciliation.success ? null : recon && recon.drift.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden /> No drift.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recon?.drift.map((row) => (
                <li key={row.walletId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link
                    href={`/dashboard/admin/finance/wallets?user=${row.userId}`}
                    className="min-w-0 truncate text-primary hover:underline"
                  >
                    {row.name ?? row.userId.slice(0, 8)}
                    {row.email && <span className="text-muted-foreground"> · {row.email}</span>}
                  </Link>
                  <span className="shrink-0 text-right tabular-nums">
                    {formatBDT(row.balanceMinor)} vs {formatBDT(row.ledgerBalanceMinor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
