"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { getOwnerPayouts } from "@/services/owner/getOwnerPayouts";
import type { OwnerPayout, PayoutStatus } from "@/services/owner/money-types";

const STATUSES: PayoutStatus[] = ["PENDING", "APPROVED", "PROCESSING", "PAID", "FAILED", "CANCELLED"];

const day = (iso: string) => format(new Date(iso), "d MMM yyyy");

const COLUMNS: Column<OwnerPayout>[] = [
  {
    key: "period",
    header: "Period",
    cell: (p) => `${day(p.periodStart)} – ${day(p.periodEnd)}`,
    mobile: "eyebrow",
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (p) => <span className="font-semibold tabular-nums">{formatBDT(p.netMinor)}</span>,
    mobile: "primary",
  },
  {
    key: "status",
    header: "Status",
    cell: (p) => <ToneBadge status={p.status}>{humanizeStatus(p.status)}</ToneBadge>,
    mobile: "trailing",
  },
  {
    key: "destination",
    header: "Destination",
    cell: (p) => p.destination ?? "—",
    mobileCell: (p) => p.destination,
    mobile: "secondary",
  },
  {
    key: "reference",
    header: "Reference",
    cell: (p) => p.reference ?? "—",
    mobileCell: (p) => (p.reference ? `Ref ${p.reference}` : null),
    className: "hidden @4xl:table-cell",
  },
  {
    key: "paidOn",
    header: "Paid on",
    cell: (p) => (p.paidAt ? day(p.paidAt) : "—"),
    mobileCell: (p) => (p.paidAt ? `Paid ${day(p.paidAt)}` : null),
  },
];

/** Every payout to the business, newest first; a row opens its detail. */
export function PayoutsClient({
  initial,
  nextCursor: initialCursor,
  status,
}: {
  initial: OwnerPayout[];
  nextCursor: string | null;
  status?: PayoutStatus;
}) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, startLoading] = useTransition();

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const result = await getOwnerPayouts({ status }, cursor);
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more payouts.");
        return;
      }
      setItems((current) => [...current, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  return (
    <div className="space-y-4">
      <FilterBar
        chips={{
          value: status ?? "all",
          options: [
            { value: "all", label: "All" },
            ...STATUSES.map((s) => ({ value: s, label: humanizeStatus(s) })),
          ],
          onChange: (value) => navigate(value === "all" ? pathname : `${pathname}?status=${value}`),
          label: "Status",
        }}
        activeCount={status ? 1 : 0}
        onClear={() => navigate(pathname)}
        pending={isPending}
      />

      <PendingRegion pending={isPending}>
        <DataList
          items={items}
          rowKey={(p) => p.id}
          columns={COLUMNS}
          caption="Payouts"
          tableFrom="3xl"
          rowHref={(p) => `/dashboard/money/payouts/${p.id}`}
          empty={
            <EmptyState
              icon={Banknote}
              title="No payouts yet"
              description="Every Monday we send what has cleared to your payout account. Each payout shows here."
            />
          }
        />
      </PendingRegion>

      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
