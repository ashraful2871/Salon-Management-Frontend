"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDhaka } from "@/components/Admin/Timeline";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { FilterBar, type FilterChip } from "@/components/Shared/FilterBar";
import { PageHeader } from "@/components/Shared/PageHeader";
import Pagination from "@/components/Shared/Pagination";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { humanizeStatus, ToneBadge } from "@/components/Shared/ToneBadge";
import { FilterNavigationProvider, useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import type { HomeListResponse } from "@/services/home-service/request";
import type {
  AdminHomeBookingQuery,
  AdminHomeBookingRow,
  HomeAudience,
  HomeBookingStatus,
} from "@/services/home-service/types";
import { SIDE_LABELS } from "./labels";

const ALL = "ALL";

const STATUSES: HomeBookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "EXPIRED",
];

type Props = { response: HomeListResponse<AdminHomeBookingRow[]>; filters: AdminHomeBookingQuery };

export function HomeBookingsClient(props: Props) {
  return (
    <FilterNavigationProvider>
      <Explorer {...props} />
    </FilterNavigationProvider>
  );
}

function Explorer({ response, filters }: Props) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [q, setQ] = useState(filters.q ?? "");
  const [salonId, setSalonId] = useState(filters.salonId ?? "");
  const rows = response.success && Array.isArray(response.data) ? response.data : [];
  const meta = response.meta;

  // Any change but paging starts again from page 1.
  const go = (next: Partial<AdminHomeBookingQuery>) => {
    const merged: AdminHomeBookingQuery = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const chips: FilterChip[] = [
    { value: ALL, label: "All" },
    ...STATUSES.map((status) => ({ value: status, label: humanizeStatus(status) })),
  ];

  const activeCount = [filters.audience, filters.salonId, filters.from, filters.to].filter(Boolean).length;

  const columns: Column<AdminHomeBookingRow>[] = [
    {
      key: "code",
      header: "Visit",
      mobile: "primary",
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {b.code}
            {b.isTest && <span className="ml-2 text-xs font-normal text-muted-foreground">test</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{b.services.join(", ")}</p>
        </div>
      ),
    },
    { key: "when", header: "When", mobile: "eyebrow", cell: (b) => formatDhaka(b.startAt) },
    { key: "customer", header: "Customer", mobile: "secondary", cell: (b) => b.customer.name },
    {
      key: "salon",
      header: "Salon",
      className: "hidden @3xl:table-cell",
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate">{b.salon.name}</p>
          <p className="truncate text-xs text-muted-foreground">{b.expert.name}</p>
        </div>
      ),
    },
    { key: "side", header: "Side", className: "hidden @3xl:table-cell", cell: (b) => SIDE_LABELS[b.audience] },
    { key: "total", header: "Total", align: "right", cell: (b) => formatBDT(b.totalMinor) },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (b) => <ToneBadge status={b.status}>{humanizeStatus(b.status)}</ToneBadge>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Home bookings"
        description="Every home visit, unpaid ones included. Open one for its timeline, money and the policy the customer accepted."
      />

      <FilterBar
        pending={isPending}
        search={{
          value: q,
          onChange: setQ,
          onSubmit: (value) => go({ q: value.trim() || undefined }),
          placeholder: "HS-code, booking ID, email, phone or name",
          label: "Search home bookings",
        }}
        chips={{
          value: filters.status ?? ALL,
          options: chips,
          onChange: (status) => go({ status: status === ALL ? undefined : (status as HomeBookingStatus) }),
          label: "Status",
        }}
        extra={
          <>
            <Select
              value={filters.audience ?? ALL}
              onValueChange={(v) => go({ audience: v === ALL ? undefined : (v as HomeAudience) })}
            >
              <SelectTrigger className="w-full md:w-36" aria-label="Side">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Both sides</SelectItem>
                <SelectItem value="LADIES">Ladies</SelectItem>
                <SelectItem value="GENTS">Gents</SelectItem>
              </SelectContent>
            </Select>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                go({ salonId: salonId.trim() || undefined });
              }}
            >
              <Input
                aria-label="Salon ID"
                placeholder="Salon ID"
                className="w-full md:w-44"
                value={salonId}
                onChange={(e) => setSalonId(e.target.value)}
              />
            </form>
            <div className="flex items-center gap-2">
              <Label htmlFor="home-from" className="shrink-0 text-xs text-muted-foreground">
                Visit date
              </Label>
              <Input
                id="home-from"
                type="date"
                aria-label="Visit date from"
                className="w-full md:w-36"
                value={filters.from ?? ""}
                onChange={(e) => go({ from: e.target.value || undefined })}
              />
              <Input
                type="date"
                aria-label="Visit date to"
                className="w-full md:w-36"
                value={filters.to ?? ""}
                onChange={(e) => go({ to: e.target.value || undefined })}
              />
            </div>
          </>
        }
        activeCount={activeCount}
        onClear={() => {
          setSalonId("");
          go({ audience: undefined, salonId: undefined, from: undefined, to: undefined });
        }}
      />

      {!response.success ? (
        <ErrorState title="Couldn't load the home visits" message={response.message} />
      ) : (
        <PendingRegion>
          <DataList
            items={rows}
            rowKey={(b) => b.id}
            columns={columns}
            density="compact"
            tableFrom="3xl"
            rowHref={(b) => `/dashboard/admin/home-service/bookings/${b.id}`}
            caption="Home bookings"
            empty={
              <EmptyState
                icon={House}
                title="No home visits match"
                description={activeCount || filters.q || filters.status ? "Try clearing a filter." : undefined}
              />
            }
          />
        </PendingRegion>
      )}

      {meta && (meta.totalPages ?? 1) > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages ?? 1}
          total={meta.total}
          pageSize={meta.limit}
          itemLabel="visits"
          disabled={isPending}
          onPageChange={(page) => go({ page })}
        />
      )}
    </div>
  );
}
