"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/lib/status-tone";
import { getOwnerTransactions } from "@/services/owner/getOwnerTransactions";
import {
  TRANSACTION_TYPES,
  transactionsQuery,
  type OwnerTransaction,
  type TransactionFilters,
} from "@/services/owner/money-types";
import { BUCKET_LABEL, DATE_PRESETS, TYPE_LABEL, bookingHref } from "./money-format";

type Branch = { salonId: string; salonName: string };

/**
 * The ledger lines behind every figure on Overview. Filters live in the URL
 * (`branch`, `type`, `range`); "Load more" appends the next cursor page.
 * The page keys this component on its query, so a filter change starts fresh.
 */
export function TransactionsClient({
  initial,
  nextCursor: initialCursor,
  filters,
  branches,
  branch,
  range,
}: {
  initial: OwnerTransaction[];
  nextCursor: string | null;
  filters: TransactionFilters;
  branches: Branch[];
  branch: string;
  range: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, startLoading] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const result = await getOwnerTransactions(filters, cursor);
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more transactions.");
        return;
      }
      setItems((current) => [...current, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  const multiBranch = branches.length > 1;
  const activeCount = [params.get("type"), params.get("range"), params.get("branch")].filter(Boolean).length;

  const columns: Column<OwnerTransaction>[] = [
    {
      key: "date",
      header: "Date",
      cell: (t) => format(new Date(t.createdAt), "d MMM yyyy, h:mm a"),
      mobileCell: (t) => format(new Date(t.createdAt), "d MMM, h:mm a"),
      mobile: "eyebrow",
    },
    {
      key: "what",
      header: "What",
      cell: (t) => (
        <div className="min-w-0">
          <p className="font-medium">{TYPE_LABEL[t.type]}</p>
          <p className="text-xs text-muted-foreground">{t.description}</p>
        </div>
      ),
      mobileCell: (t) => TYPE_LABEL[t.type],
      mobile: "primary",
    },
    {
      key: "detail",
      header: "Detail",
      cell: () => null,
      mobileCell: (t) => t.description,
      mobile: "secondary",
      className: "hidden",
    },
    ...(multiBranch
      ? [{ key: "branch", header: "Branch", cell: (t: OwnerTransaction) => t.salonName } satisfies Column<OwnerTransaction>]
      : []),
    {
      key: "booking",
      header: "Booking",
      cell: (t) =>
        t.appointment?.token ? (
          <Link href={bookingHref(t.appointment.token)} className="font-medium text-primary underline-offset-4 hover:underline">
            {t.appointment.token}
            {t.appointment.serviceName && (
              <span className="block text-xs font-normal text-muted-foreground">{t.appointment.serviceName}</span>
            )}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      mobileCell: (t) =>
        t.appointment?.token ? (
          <Link href={bookingHref(t.appointment.token)} className="font-medium text-primary">
            {t.appointment.token}
          </Link>
        ) : null,
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => (
        <ToneBadge status={t.bucket} tone={BUCKET_LABEL[t.bucket].tone}>
          {BUCKET_LABEL[t.bucket].label}
        </ToneBadge>
      ),
      mobileCell: (t) => BUCKET_LABEL[t.bucket].label,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (t) => (
        <span className={cn("font-semibold tabular-nums", TONE_CLASSES[t.amountMinor < 0 ? "danger" : "success"].text)}>
          {t.amountMinor > 0 ? "+" : ""}
          {formatBDT(t.amountMinor)}
        </span>
      ),
      mobile: "trailing",
    },
  ];

  const csvQuery = transactionsQuery(filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <FilterBar
            chips={{
              value: filters.type ?? "all",
              options: [{ value: "all", label: "All" }, ...TRANSACTION_TYPES],
              onChange: (value) => setParam("type", value === "all" ? null : value),
              label: "Type",
            }}
            extra={
              <>
                {multiBranch && (
                  <Select value={branch} onValueChange={(v) => setParam("branch", v)}>
                    <SelectTrigger className="w-full rounded-full md:w-56" aria-label="Branch">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.salonId} value={b.salonId}>
                          {b.salonName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={range} onValueChange={(v) => setParam("range", v === "all" ? null : v)}>
                  <SelectTrigger className="w-full rounded-full md:w-44" aria-label="Dates">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            activeCount={activeCount}
            onClear={() => navigate(pathname)}
            pending={isPending}
          />
        </div>
        <Button asChild variant="outline" className="shrink-0 self-start">
          <a href={`/api/owner/export/transactions.csv${csvQuery ? `?${csvQuery}` : ""}`} download>
            <Download aria-hidden="true" /> Download CSV
          </a>
        </Button>
      </div>

      <PendingRegion pending={isPending}>
        <DataList
          items={items}
          rowKey={(t) => t.id}
          columns={columns}
          caption="Transactions"
          tableFrom="3xl"
          empty={
            <EmptyState
              icon={Receipt}
              title="No transactions"
              description={
                activeCount > 0
                  ? "Nothing matches these filters."
                  : "Money from bookings shows here once a booking is completed."
              }
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
