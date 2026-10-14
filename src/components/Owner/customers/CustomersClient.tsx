"use client";

import { useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { getOwnerCustomers } from "@/services/owner/getOwnerCustomers";
import {
  CUSTOMER_SEGMENTS,
  type CustomerCounts,
  type CustomerFilters,
  type OwnerCustomer,
} from "@/services/owner/customer-types";
import { TagChips } from "./TagChips";

const day = (iso: string | null) => (iso ? format(new Date(iso), "d MMM yyyy") : "—");

/**
 * Everyone who booked at the branch(es) in view. Segment and search live in
 * the URL (`segment`, `q`); "Load more" appends the next cursor page. The
 * page keys this component on its filters, so a change starts fresh.
 */
export function CustomersClient({
  initial,
  nextCursor: initialCursor,
  counts,
  filters,
}: {
  initial: OwnerCustomer[];
  nextCursor: string | null;
  counts: CustomerCounts | null;
  filters: CustomerFilters;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [search, setSearch] = useState(filters.search ?? "");
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
      const result = await getOwnerCustomers(filters, cursor);
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more customers.");
        return;
      }
      setItems((current) => [...current, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  const activeCount = [filters.segment, filters.search].filter(Boolean).length;

  const columns: Column<OwnerCustomer>[] = [
    {
      key: "name",
      header: "Customer",
      mobile: "primary",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{c.name}</p>
          {c.tags.length > 0 && <TagChips tags={c.tags} className="mt-1" />}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      mobile: "secondary",
      cell: (c) => <span className="tabular-nums">{c.phone ?? "—"}</span>,
    },
    {
      key: "visits",
      header: "Visits",
      align: "right",
      cell: (c) => <span className="tabular-nums">{c.visits}</span>,
      mobileCell: (c) => `${c.visits} ${c.visits === 1 ? "visit" : "visits"}`,
    },
    {
      key: "lastVisit",
      header: "Last visit",
      cell: (c) => day(c.lastVisit),
      mobileCell: (c) => (c.lastVisit ? `Last ${day(c.lastVisit)}` : "No visit yet"),
    },
    {
      key: "spent",
      header: "Spent",
      align: "right",
      mobile: "trailing",
      cell: (c) => <span className="font-medium tabular-nums">{formatBDT(c.spentMinor)}</span>,
    },
    {
      key: "noShows",
      header: "No-shows",
      align: "right",
      className: "hidden @3xl:table-cell",
      cell: (c) => (
        <span className={c.noShows >= 2 ? "font-medium text-danger tabular-nums" : "tabular-nums"}>{c.noShows}</span>
      ),
      mobileCell: (c) => (c.noShows > 0 ? `${c.noShows} no-show${c.noShows === 1 ? "" : "s"}` : null),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          onSubmit: (value) => setParam("q", value.trim() || null),
          placeholder: "Search name, phone or email",
          label: "Search customers",
        }}
        chips={{
          value: filters.segment ?? "all",
          options: [
            { value: "all", label: "All", count: counts?.all },
            ...CUSTOMER_SEGMENTS.map((s) => ({ ...s, count: counts?.[s.value] })),
          ],
          onChange: (value) => setParam("segment", value === "all" ? null : value),
          label: "Segment",
        }}
        activeCount={activeCount}
        onClear={() => {
          setSearch("");
          navigate(pathname);
        }}
        pending={isPending}
      />

      <PendingRegion pending={isPending}>
        <DataList
          items={items}
          rowKey={(c) => c.customerId}
          rowHref={(c) => `/dashboard/customers/${c.customerId}`}
          columns={columns}
          caption="Customers"
          tableFrom="3xl"
          empty={
            <EmptyState
              icon={Users}
              title="No customers"
              description={
                activeCount > 0
                  ? "Nobody matches these filters."
                  : "Customers show here after their first booking."
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
